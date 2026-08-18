# Tunda Gula Windows Onboarding Guide

This guide helps a Windows user set up and run the Tunda Gula project locally.

---

## 1. Install the required tools

Install these on your Windows machine:

- Git for Windows
- Visual Studio Code
- Docker Desktop
- Node.js LTS (v20 or newer)
- Python 3.12

If you want to install Python and Node.js directly from Command Prompt, you can use the official installers via winget:

```cmd
winget install --id Python.Python.3.12 -e
winget install --id OpenJS.NodeJS.LTS -e
```

If winget is not available, download them from the official sites:

- Python: https://www.python.org/downloads/windows/
- Node.js: https://nodejs.org/

Optional but useful:

- Git Bash
- Postman or Insomnia for API testing

> Make sure Docker Desktop is running before you start the app.

---

## 2. Clone the repository

Open Command Prompt and run:

```cmd
git clone <repo-url>
cd "Tunda Gula"
```

If the folder name has spaces, keep it in quotes.

---

## 3. Create the environment file

At the project root, create a file named `.env`.

Example:

```env
POSTGRES_DB=tundagula
POSTGRES_USER=tundagula
POSTGRES_PASSWORD=tundagula_secret_password
DEBUG=True
SECRET_KEY=change-this-in-production
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3002
VITE_API_URL=http://localhost:8001/api/v1
```

If you want the quickest setup, use this file at the root of the project, not inside the backend or frontend folder.

---

## 4. Start the full project with Docker

From the project root, run:

```cmd
docker compose up --build
```

This starts the full stack:

- PostgreSQL database on port 5432
- Django backend on port 8001
- React frontend on port 3000

This is the recommended first-run option because it matches the project’s configured Docker setup.

### Open the app

- Frontend: http://localhost:3000
- Backend API: http://localhost:8001/api/v1
- Django admin: http://localhost:8001/admin

### Stop the app

```cmd
docker compose down
```

If you want to remove the database volume too:

```cmd
docker compose down -v
```

---

## 5. Run the project without Docker

Use this method if you want to develop directly on Windows.

### 5.1 Backend setup

Open Command Prompt in the project folder:

```cmd
cd backend
python -m venv .venv
.\.venv\Scripts\activate.bat
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8001
```

The backend will run at:

- http://localhost:8001

### 5.2 Frontend setup

Open a second Command Prompt window:

```cmd
cd frontend
npm install
set VITE_API_URL=http://localhost:8001/api/v1
npm run dev
```

The frontend will run at:

- http://localhost:3002

> In Command Prompt, environment variables are set with `set NAME=value`.

---

## 6. Useful commands

### Backend

```cmd
cd backend
.\.venv\Scripts\activate.bat
python manage.py makemigrations
python manage.py migrate
python manage.py test
python manage.py runserver 0.0.0.0:8001
```

### Frontend

```cmd
cd frontend
npm install
npm run dev
npm run build
```

### Docker

```cmd
docker compose up --build
docker compose down
docker compose logs -f
```

---

## 7. Project structure

- `backend/` — Django REST API
- `frontend/` — React + Vite frontend
- `docker-compose.yml` — Docker setup for local development
- `backend/config/settings.py` — Django settings and environment configuration

---

## 8. Troubleshooting

### Docker is not starting

- Make sure Docker Desktop is running.
- Restart Docker Desktop and try again.
- Check whether ports 3000, 5432, and 8001 are already in use.

### Command Prompt activation issues

If the virtual environment does not activate, use the full path:

```cmd
C:\path\to\project\backend\.venv\Scripts\activate.bat
```

Then run the Django commands again.

### Frontend cannot reach the API

- Confirm the backend is running.
- Check that `VITE_API_URL` matches the backend address.
- Verify the app is calling `http://localhost:8001/api/v1`.

### You want a clean reset

```cmd
docker compose down -v
```

This removes the database volume and resets the container state.

---

## 9. Default access points

- Frontend: http://localhost:3000
- Frontend dev mode: http://localhost:3002
- Backend: http://localhost:8001
- Database: localhost:5432

---

## 10. Recommendation

For a first-time Windows setup, start with Docker from the project root. It is the simplest way to bring the entire application online without manual dependency issues.
