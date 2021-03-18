## Additional Configuration

### Background Process
You can use systemd on Linux to run your bot as a system process.  This allows your bot to run in the background and autostart on boot.  To enable this, create a file called `steve.service` in `/etc/systemd/system` with the following contents:
```
[Unit]
Description=Steve Discord Bot
After=syslog.target network.target

[Service]
User=<YOUR USERNAME>
Group=<YOUR GROUP>

Type=simple

WorkingDirectory=/opt/Steve
ExecStart=npm run production
TimeoutStopSec=20
KillMode=process
Restart=on-failure

[Install]
WantedBy=multi-user.target
```
Replace <YOUR USERNAME> and <YOUR GROUP> with your Linux username and group.

### Backups
It is recommended to back up your database every so often, as to not lose any data in the event of a potential hardware or data failure.  To make backups easy, all you need to do is run the [backup script](../../scripts/backup.sh) to create a timedate backup file of the database.

To automate this process, we will use cron.

```bash
# Open crontab editor
crontab -e
```

In the crontab file, add this line:
```bash
# Create a backup of the database once a day
0 0 * * * /opt/Steve/scripts/backup.sh
```
Save and close the file.  Now, cron will automatically backup your database once a day at 00:00 (12AM).