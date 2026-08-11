# ============================================================
# TundaGula Backend — Dockerfile
# Multi-stage build: slim Python image + gunicorn production server
# ============================================================

FROM python:3.12-slim AS base

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# System dependencies for psycopg2 and Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    libjpeg62-turbo-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# ---------------------------------------------------------------------------
# Dependencies stage — cached layer for pip install
# ---------------------------------------------------------------------------
FROM base AS deps

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ---------------------------------------------------------------------------
# Application stage
# ---------------------------------------------------------------------------
FROM deps AS app

WORKDIR /app

# Copy entire backend source
COPY . .

# Copy and set entrypoint
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Create directories for static and media files
RUN mkdir -p /app/staticfiles /app/media

# Expose the application port
EXPOSE 8000

# Entrypoint handles: wait for DB → migrate → create superuser → collectstatic
ENTRYPOINT ["bash", "/app/entrypoint.sh"]

# Default command — gunicorn production server
CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "3", \
     "--timeout", "120", \
     "--limit-request-field_size", "16384", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
