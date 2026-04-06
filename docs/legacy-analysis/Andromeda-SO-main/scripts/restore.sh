#!/bin/bash

# Andromeda OS — Database Restore Script
# Usage: ./restore.sh <backup_file_path>

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./restore.sh <backup_file_path>"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

echo "WARNING: This will overwrite the current database!"
read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled."
    exit 1
fi

echo "Starting restore from ${BACKUP_FILE}..."

# Check if gunzip and psql are available
if ! command -v gunzip &> /dev/null || ! command -v psql &> /dev/null; then
    echo "Error: gunzip or psql could not be found."
    exit 1
fi

# Execute restore
if [ -n "$DATABASE_URL" ]; then
    gunzip -c "${BACKUP_FILE}" | psql --dbname="$DATABASE_URL"
else
    gunzip -c "${BACKUP_FILE}" | psql -U andromeda -h localhost -d andromeda_dev
fi

if [ $? -eq 0 ]; then
    echo "Restore completed successfully!"
else
    echo "Restore failed!"
    exit 1
fi
