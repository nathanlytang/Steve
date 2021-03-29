# Additional Configuration

The following configurations are made with Linux hosting in mind.  

## Daemon
You can use systemd on Linux to run your bot as a system process.  This allows your bot to run in the background and autostart on boot.  To enable this, create a file called `steve.service` in `/etc/systemd/system` with the following contents:
```
[Unit]
Description=Steve Discord Bot
After=syslog.target network.target mysql.service

[Service]
User=YOUR_USERNAME
Group=YOUR_GROUP

Type=simple

WorkingDirectory=/opt/Steve
ExecStart=npm run production
TimeoutStopSec=20
KillMode=mixed
Restart=on-failure

[Install]
WantedBy=multi-user.target
```
Replace YOUR_USERNAME and YOUR_GROUP with your Linux username and group.

## Backups
It is recommended to back up your database every so often, as to not lose any data in the event of a potential hardware or data failure.  To make backups easy, all you need to do is run the [backup script](https://github.com/nathanlytang/Steve/blob/master/scripts/backup.sh) to create a timedate backup file of the database.

### Setup
The backup script should already be installed if you downloaded the zip file or cloned the repository.  In the script, you will find a section that looks like this:
```bash
# Variables
DATABASE=stevebot # Name of your database
BACKUP=/opt/Steve/backups # Path to your backup location
DATE=$(date +"%Y-%m-%d-T%H-%M-%S") # Current date and time
FILE=steve-bot-data-$DATE.sql # Backup file name
```
Change the `DATABASE` and `BACKUP` variables to match your configuration.  To run the backup script:
```bash
/opt/Steve/scripts/backup.sh -u stevebotuser -h 127.0.0.1 -p somePassword
```
**NOTE**: Change the user and password to match the user and password you set up in the database.  Change the path to match the path to your backup script as well.

### Automate
To automate this process, we will use cron.
```bash
# Open crontab editor
crontab -e
```

In the crontab file, add this line:
```bash
# Create a backup of the database once a day

# Change the user and password to match the user and password you set up in the database.
# Change the path to match the path to your backup script as well.
0 0 * * * /opt/Steve/scripts/backup.sh -u stevebotuser -h 127.0.0.1 -p somePassword
```

Save and close the file.  Now, cron will automatically backup your database once a day at 00:00 (12AM).
