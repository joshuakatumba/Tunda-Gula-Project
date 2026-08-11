#!/bin/bash
# =============================================================================
# TundaGula Backend — Docker Entrypoint
# Runs migrations, creates superuser, and starts the app server.
# =============================================================================

set -e

echo "🌱 TundaGula Backend — Starting up..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for database..."
while ! python -c "
import os, socket
host = os.environ.get('DB_HOST', 'db')
port = int(os.environ.get('DB_PORT', 5432))
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(2)
try:
    s.connect((host, port))
    s.close()
    exit(0)
except Exception:
    exit(1)
" 2>/dev/null; do
    echo "   Database not ready yet — retrying in 2s..."
    sleep 2
done
echo "✅ Database is ready"

# Run migrations
echo "📦 Running migrations..."
python manage.py migrate --noinput

# Create superuser if it doesn't exist
echo "👤 Checking superuser..."
python manage.py shell -c "
from accounts.models import User
phone = '${DJANGO_SUPERUSER_PHONE:-0700000000}'
if not User.objects.filter(phone=phone).exists():
    User.objects.create_superuser(
        phone=phone,
        name='${DJANGO_SUPERUSER_NAME:-Admin}',
        role='${DJANGO_SUPERUSER_ROLE:-admin}',
        password='${DJANGO_SUPERUSER_PASSWORD:-admin123}',
    )
    print(f'  ✅ Superuser created: {phone}')
else:
    print(f'  ℹ️  Superuser already exists: {phone}')
"

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput --clear 2>/dev/null || true

echo "🚀 Starting server..."

# Execute the CMD passed to docker (gunicorn by default)
exec "$@"
