#!/bin/bash

# Andromeda OS — Database Backup Script
# Usage: ./backup.sh [backup_dir]

BACKUP_DIR=${1:-"./backups"}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="andromeda-db-${TIMESTAMP}.sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

echo "Starting backup to ${FILEPATH}..."

# Check if pg_dump is available
if ! command -v pg_dump &> /dev/null; then
    echo "Error: pg_dump could not be found. Please install PostgreSQL client tools."
    exit 1
fi

# Execute pg_dump and compress
# Assuming connection parameters are passed via env vars or .pgpass
# In this environment, we'll try to extract from DATABASE_URL if available or assume defaults
if [ -n "$DATABASE_URL" ]; then
    # Simple extraction of connection string parts might be complex in bash,
    # so we'll pass the URL directly if pg_dump supports it (it usually does via --dbname)
    pg_dump --dbname="$DATABASE_URL" --no-owner --no-acl | gzip > "${FILEPATH}"
else
    # Fallback to local defaults if no URL
    pg_dump -U andromeda -h localhost -d andromeda_dev --no-owner --no-acl | gzip > "${FILEPATH}"
fi

if [ $? -eq 0 ]; then
    echo "Backup completed successfully: ${FILENAME}"
    
    # Cleanup old backups (optional, based on retention)
    # find "${BACKUP_DIR}" -name "andromeda-db-*.sql.gz" -mtime +7 -delete
    
    echo "${FILENAME}"
else
    echo "Backup failed!"
    exit 1
fi
