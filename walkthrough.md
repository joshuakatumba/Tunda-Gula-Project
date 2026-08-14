# Tunda Gula — CI/CD Deployment Journey

> A brutally honest account of deploying a dockerized Django + React application to the cloud with GitHub Actions CI/CD.

---

## The Starting Point

The Tunda Gula platform is a full-stack marketplace application:
- **Frontend:** React 18 + Vite + TypeScript, served via Nginx
- **Backend:** Django REST Framework API
- **Database:** PostgreSQL
- **Orchestration:** Docker Compose (all three services unified)

Everything was already working perfectly on `localhost`. The frontend talked to the backend via a centralized API client ([client.ts](file:///home/darknight/Desktop/Tunda%20Gula/frontend/src/api/client.ts)), CORS was configured, endpoints matched. The goal was simple: **make it accessible from anywhere on the internet using CI/CD.**

---

## Phase 1: The Great Hosting Debate

### Attempt 1 — GCP (Google Cloud Platform)
The initial plan was to use GCP's "Always Free" `e2-micro` VM. A full implementation plan was drafted, the `deploy.yml` workflow was designed around it.

> **🚧 Frustration:** GCP turned out to not be an option for the user. Plan scrapped.

### Attempt 2 — Free PaaS (Vercel + Render + Neon)
Pivoted to a decoupled free architecture: Vercel for frontend, Render/Koyeb for backend, Neon for database. No GitHub Actions needed — these platforms have built-in CI/CD.

> **🚧 Frustration:** The user wanted server-side rendering (though the app is actually an SPA) and recalled a previous conversation about GCP. This plan was also scrapped.

### Attempt 3 — Azure for Students ✅
The user revealed they had an **Azure Student Account**, which provides a free `B1s` VM (1 vCPU, 1GB RAM) for 12 months. This was the perfect fit — we could deploy the entire Docker Compose stack to a single server, just like the original GCP plan.

**Decision made: Azure B1s + GitHub Actions CI/CD.**

---

## Phase 2: Creating the Azure VM

### The Azure Portal Form
The Azure VM creation form is intimidating. Key mistakes to avoid:

> **🚧 Frustration:** Azure defaulted to `Standard_D2s_v3` ($96/month) in `Switzerland North`, which was blocked for student accounts. The error message was cryptic: *"This size is currently unavailable in switzerlandnorth for this subscription: NotAvailableForSubscription."*

**Fix:** Had to manually change:
- **Region** → `East US` or `West Europe` (Switzerland North has limited free capacity)
- **Size** → Click "See all sizes" → search for `B1s` → select `Standard_B1s` (this is the free one)
- **Inbound ports** → Must select HTTP (80), HTTPS (443), AND SSH (22) — if you forget HTTP, nobody can see the website

### The SSH Key Download
Azure generates an SSH keypair during VM creation and gives you exactly ONE chance to download the `.pem` file.

> [!CAUTION]
> If you miss the "Download private key and create resource" popup, the key is gone forever and you'd have to recreate the VM.

**Result:** VM created successfully. Public IP: `40.127.8.37`. SSH key saved as `TundaGula.pem`.

---

## Phase 3: Writing the GitHub Actions Workflow

The user wanted to write the code themselves for learning purposes. The target file: [deploy.yml](file:///home/darknight/Desktop/Tunda%20Gula/.github/workflows/deploy.yml).

### YAML is Unforgiving

> **🚧 Frustration:** YAML requires precise indentation. The hand-written file had multiple issues:

```diff
# Issue 1: Missing space after dash
-      -main
+      - main

# Issue 2: Missing space after dash  
-      -name: Deploy to server via SSH
+      - name: Deploy to server via SSH

# Issue 3: Incorrect indentation (uses/with must be inside the step)
-      uses: appleboy/ssh-action@master
-      with:
+        uses: appleboy/ssh-action@master
+        with:

# Issue 4: Missing pipe character for multi-line script
-        script: 
+        script: |

# Issue 5: Typo in filename
-          docker compose -f docke-compose.yml
+          docker compose -f docker-compose.yml
```

These were eventually fixed (some by the user, some by me when the user got frustrated).

---

## Phase 4: GitHub Secrets — The Navigation Nightmare

GitHub Actions needs three secrets to SSH into the Azure server: `AZURE_HOST`, `AZURE_USERNAME`, `AZURE_SSH_KEY`.

### Wrong Settings Page

> **🚧 Frustration:** The user went to their **Personal Account Settings** → **SSH and GPG Keys** instead of the **Repository Settings** → **Secrets and variables** → **Actions**. These are completely different pages that look similar.

**Fix:** Navigate directly via URL: `https://github.com/joshuakatumba/Tunda-Gula-Project/settings/secrets/actions`

### 404 Error

> **🚧 Frustration:** Trying the direct URL initially returned a 404 page. This was likely because the repository name or path was slightly different.

**Fix:** Eventually found the correct page through the repository's own Settings tab.

---

## Phase 5: Cloning the Repo on the Azure Server

The server needs a copy of the code so GitHub Actions can run `git pull` to update it.

### GitHub Password Authentication is Dead

> **🚧 Frustration:** Running `git clone` on the Azure server and entering a GitHub password failed with: *"Password authentication is not supported for Git operations."*

GitHub discontinued password-based authentication in 2021. You must use a **Personal Access Token (PAT)** instead.

### The Placeholder URL Disaster

> **🚧 Major Frustration:** The clone command was provided with a placeholder URL:
> ```bash
> git clone https://github.com/your-username/Tunda-Gula-Project.git
> ```
> The user copied this literally, resulting in `Repository not found` errors because there is no GitHub user called `your-username`. This was repeated multiple times before the issue was identified.

**Fix:** The correct command with the actual username:
```bash
git clone https://github.com/joshuakatumba/Tunda-Gula-Project.git
```

### Creating a Personal Access Token
To authenticate on the server:
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with the **`repo`** scope checked
3. Use the `ghp_...` token as the "password" when cloning

---

## Phase 6: The `.env` File Puzzle

### `.env` is Gitignored (By Design)

> **🚧 Frustration:** The `.env` file contains secret passwords and API keys. It is listed in `.gitignore`, meaning `git push` will NEVER send it to GitHub, and `git pull` on the server will NEVER download it. This is a security feature, not a bug.

**Consequence:** The `.env` file must be **manually created on the server** via `nano ~/Tunda-Gula-Project/.env`. There is no way around this.

### Production `.env` Requires Real IP
The local `.env` uses `localhost` everywhere. The production `.env` must use the Azure Public IP:
```diff
-ALLOWED_HOSTS=localhost,127.0.0.1,backend
+ALLOWED_HOSTS=localhost,127.0.0.1,backend,40.127.8.37

-VITE_API_URL=http://localhost:8001/api/v1
+VITE_API_URL=http://40.127.8.37:8001/api/v1

-DEBUG=True
+DEBUG=False
```

---

## Phase 7: The Deployment Failures

### Failure 1: Invalid YAML Syntax
The original hand-written `deploy.yml` had indentation errors. GitHub Actions couldn't even parse the file.

**Fix:** Corrected all indentation issues.

### Failure 2: Wrong Secret Names
The `deploy.yml` was updated to use `AZURE_HOST`, `AZURE_USERNAME`, `AZURE_SSH_KEY`, but the user may have created secrets with `GCP_*` names (from the original GCP plan).

**Fix:** Verified and recreated secrets with the correct `AZURE_*` names.

### Failure 3: DNS Resolution Error
```
dial tcp: lookup *** on 127.0.0.53:53: server misbehaving
```

> **🚧 Frustration:** The SSH connection failed instantly. The host value was being read (masked as `***`) but DNS couldn't resolve it. This was caused by extra whitespace or invisible characters in the `AZURE_HOST` secret value.

**Fix:** Re-entered the `AZURE_HOST` secret with just the raw IP `40.127.8.37` — no spaces, no `http://`, no trailing newline.

### Success! ✅
After fixing the secrets, the pipeline finally turned green:
```json
{
  "conclusion": "success",
  "displayTitle": "Merge pull request #1..."
}
```

---

## Lessons Learned

1. **YAML is brutal.** A single misplaced space can break an entire CI/CD pipeline. Always validate YAML files before pushing.
2. **Never use placeholder values like `your-username`.** Always use the actual values in documentation, or make it abundantly clear that substitution is required.
3. **GitHub has TWO settings pages.** Personal Settings ≠ Repository Settings. Secrets for Actions live in the repository.
4. **`.env` files are never pushed to Git.** This is a security feature. Production environment variables must be configured directly on the server.
5. **GitHub killed password authentication.** You need a Personal Access Token (PAT) to clone repos from a server.
6. **Azure VM creation defaults are expensive.** Always manually select the free `B1s` size and a supported region.
7. **Secret values are sensitive to whitespace.** A single trailing space in an IP address can cause DNS resolution failures.

---

## Files Created/Modified

| File | Purpose |
|------|---------|
| [deploy.yml](file:///home/darknight/Desktop/Tunda%20Gula/.github/workflows/deploy.yml) | GitHub Actions workflow — SSHs into Azure and deploys |
| [docker-compose.prod.yml](file:///home/darknight/Desktop/Tunda%20Gula/docker-compose.prod.yml) | Production override — maps frontend to port 80 |
| [.env](file:///home/darknight/Desktop/Tunda%20Gula/.env) | Updated with Azure Public IP (`40.127.8.37`) |

## Current Status
✅ GitHub Actions pipeline is **green** and deploying successfully.
⏳ Awaiting verification that the site loads at `http://40.127.8.37`.
