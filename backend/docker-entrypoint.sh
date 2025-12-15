#!/bin/bash
set -e

# Wait for database to be ready
echo "Waiting for database..."
python << EOF
import time
import psycopg2
import os

database_url = os.environ.get('DATABASE_URL', '')
if database_url:
    import re
    match = re.match(r'postgres://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', database_url)
    if match:
        user, password, host, port, dbname = match.groups()
        while True:
            try:
                conn = psycopg2.connect(
                    dbname=dbname,
                    user=user,
                    password=password,
                    host=host,
                    port=port
                )
                conn.close()
                print("Database is ready!")
                break
            except psycopg2.OperationalError:
                print("Database not ready, waiting...")
                time.sleep(2)
EOF

# Run migrations
echo "Running migrations..."
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Create superuser if not exists
echo "Creating superuser if not exists..."
python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    user = User.objects.create_superuser(
        username='admin',
        email='admin@admin.com',
        password='admin123'
    )
    # Set full_name if the field exists
    if hasattr(user, 'full_name'):
        user.full_name = 'Administrador'
        user.save()
    print("Superuser created: admin / admin123")
else:
    print("Superuser already exists")
EOF

# Start server
echo "Starting Gunicorn..."
exec gunicorn --bind 0.0.0.0:8000 --workers 3 config.wsgi:application
