#!/bin/bash

# Get arguments
while getopts u:p:h: flag
do
    case "${flag}" in
        u) username=${OPTARG};;
        p) password=${OPTARG};;
        h) host=${OPTARG};;
    esac
done

# Check if required arguments
if [ -z "$username" ] || [ -z "$password" ] || [ -z "$host" ]; then
    echo "No arguments found.  Aborting."
    exit 1
fi

# Variables
DATABASE=stevebot # Name of your database
BACKUP=/opt/Steve/backups # Path to your backup location
DATE=$(date +"%Y-%m-%d-T%H-%M-%S") # Current date and time
FILE=steve-bot-data-$DATE.sql # Backup file name

# Create backups folder if not exist
if [ ! -d $BACKUP ]; then
  mkdir -p $BACKUP;
fi

# Execute mysqldump and backup file to path
echo "Backup process started - $DATE"
output=$(mysqldump --user=$username --host=$host --password=$password $DATABASE > $BACKUP/$FILE)

# Check if backup successful
if [ $(echo $?) != 0 ]
then
    # If not successful, delete empty file
    echo "Failed to back up database. Aborting."
    rm $BACKUP/$FILE
    exit 1
else
    echo "Backup successful.  Backup stored in $BACKUP/$FILE."
    exit 0
fi