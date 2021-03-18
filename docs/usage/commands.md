# Commands
Below are all the commands that can be executed by the bot.

## General Commands
Commands that can be executed by anybody in the server.
### Help

Displays all the commands available.
<img src="../assets/preview_help.png" style="display: block; border-radius: 10px / 7px; ">

### Status
Displays the status of your Minecraft server.
<img src="../assets/preview_status.png" style="display: block; border-radius: 10px / 7px; ">

### IP / Join
Display the IP Address/URL of the Minecraft server.
<img src="../assets/preview_ip.png" style="display: block; border-radius: 10px / 7px; ">

### Skin
Specify a Minecraft player name (Eg. `-mc skin Alienics_`) to display their Minecraft skin.
<img src="../assets/preview_skin.png" style="display: block; border-radius: 10px / 7px; ">

## Administrator Only Commands
Only Discord users with the administrator permission can execute these commands.
### Setup

If used without arguments (`-mc setup`), Steve will display setup instructions.  Using any of the following arguments will change the settings.
<img src="../assets/preview_setup.png" style="display: block; border-radius: 10px / 7px; ">

##### Available arguments
* `ip` - Set the IP address or URL of your Minecraft server.  Eg. `-mc setup ip yourserver.com`
* `port` - Set the port of your server if not default (25565).  Eg. `-mc setup port 25565`
* `query` - Enable or disable server querying. (Default enabled).  Eg. `-mc setup query enable`
* `name` - Set the name of your Minecraft server.  Eg. `-mc setup name Your Server`
* `footer` - Set a short message to be displayed every time the `status` command is called. Eg. `-mc setup footer Come play with us!`


### Settings
Displays your current setup without changing settings.
<img src="../assets/preview_settings.png" style="display: block; border-radius: 10px / 7px; ">

### Leave
Steve will leave your server.
<img src="../assets/preview_leave.png" style="display: block; border-radius: 10px / 7px; ">