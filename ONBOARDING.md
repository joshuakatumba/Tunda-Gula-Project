# Tunda Gula Developer Onboarding Guide

Welcome to the Tunda Gula engineering team! This guide will walk you through setting up the project on your local machine.

The project is fully dockerized, meaning the setup process is virtually identical whether you are on **macOS** or **Windows**.

---

## 1. Prerequisites

Before cloning the project, ensure you have the following installed on your system:

### For macOS
- **Git:** Comes pre-installed (or install via `xcode-select --install`).
- **Docker Desktop for Mac:** [Download here](https://www.docker.com/products/docker-desktop/).
- **Node.js (v18+):** Required only if you want to run the frontend with Hot Module Replacement (HMR). [Download here](https://nodejs.org/) or install via Homebrew (`brew install node`).

### For Windows
- **Git for Windows:** [Download here](https://gitforwindows.org/) (Provides Git Bash).
- **WSL 2 (Windows Subsystem for Linux):** Highly recommended for Docker. Run `wsl --install` in an administrative terminal.
- **Docker Desktop for Windows:** [Download here](https://www.docker.com/products/docker-desktop/). Ensure it is configured to use the WSL 2 backend in settings.
- **Node.js (v18+):** Required for frontend HMR. [Download here](https://nodejs.org/).

---

## 2. Cloning the Repository

Open your terminal (or Git Bash on Windows) and run:

```bash
git clone https://github.com/joshuakatumba/Tunda-Gula-Project.git
cd "Tunda Gula"
```

---

## 3. Environment Configuration

You need to set up your environment variables before running the application. We have provided a template for you.

```bash
# Copy the example environment file
cp .env.example .env
```
*(On Windows Command Prompt, use `copy .env.example .env`)*

Open the `.env` file in your code editor and verify the settings. The default values (using `tundagula` for DB credentials) are fine for local development.

---

## 4. Starting the Application (Docker)

To spin up the PostgreSQL database, Django backend, and the compiled React frontend, simply run:

```bash
docker compose up --build
```

**What this does:**
1. Starts a PostgreSQL 16 database (`localhost:5432`).
2. Builds the Django Backend API, runs database migrations, and exposes it at `http://localhost:8001`.
3. Builds the React Frontend (Vite) and serves it via Nginx at `http://localhost:3000`.

To stop the application, press `Ctrl+C` in the terminal, or run in a separate tab:
```bash
docker compose down
```

---

## 5. Active Frontend Development (Hot Reloading)

When the frontend is running via Docker, it serves a static production build. If you are actively developing the frontend, you'll want Hot Module Replacement (HMR).

1. Keep the backend and database running via Docker:
   ```bash
   docker compose up db backend -d
   ```
2. Open a new terminal tab and navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

Your frontend will now be available at `http://localhost:3002` (or whatever port Vite assigns), and any changes you make to the React code will update instantly in the browser.

---

## 6. Accessing the Backend Admin Panel

When you run `docker compose up --build`, the backend `entrypoint.sh` automatically runs database migrations.

To access the Django Admin panel:
1. Go to `http://localhost:8001/admin`
2. **Username:** Check `.env` or create a superuser manually if needed:
   ```bash
   docker exec -it tundagula_backend python manage.py createsuperuser
   ```

---

## 7. Running Frontend or Backend Individually (Standalone Docker)

If you need to isolate services and run the frontend or backend individually using their respective `Dockerfile`s instead of the root `docker-compose`, follow these instructions:

### Running the Backend Standalone
Navigate to the backend directory, build the image, and run it:
```bash
cd backend
docker build -t tundagula-backend .
docker run -p 8001:8000 --env-file ../.env tundagula-backend
```
*Note: You may need to adjust your database host in `.env` (e.g., `host.docker.internal`) so the container can connect to your local PostgreSQL instance.*

### Running the Frontend Standalone
Navigate to the frontend directory, build the production image, and run it:
```bash
cd frontend
docker build --build-arg VITE_API_URL=http://localhost:8001/api/v1 -t tundagula-frontend .
docker run -p 3000:80 tundagula-frontend
```
The frontend will then be accessible at `http://localhost:3000`.

---

## 8. Troubleshooting

- **Windows Line Endings:** If you get `\r` (carriage return) errors when building the backend Docker image, ensure Git is configured to checkout files with `LF` line endings, or convert `backend/entrypoint.sh` to `LF` in your editor.
- **Port Conflicts:** If `localhost:5432`, `8001`, or `3000` are already in use, you will need to stop whatever service is using them, or change the exposed ports in `docker-compose.yml`.
- **Database Reset:** If you need to completely wipe the database and start fresh:
  ```bash
  docker compose down -v
  ```
