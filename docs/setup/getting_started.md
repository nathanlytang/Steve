# Getting Started

The following document is a tutorial on how to host the bot yourself.  Click [here](https://discord.com/oauth2/authorize?client_id=773117222380896276&permissions=18432&scope=bot) to invite the bot if you do not wish to self host.

## Install Script
A script is available [here](https://raw.githubusercontent.com/nathanlytang/Steve/master/scripts/setup.sh) for Linux installations.  If you are using Windows or do not wish to use this script, skip to the next section.

To use this script, run this command with **root access**:
```bash
wget -q https://raw.githubusercontent.com/nathanlytang/Steve/master/scripts/setup.sh && sudo ./setup.sh
```
**NOTE**: The Discord application still must be created manually on the [Discord Developer Portal](https://discord.com/developers/applications). The guide on setting up a Discord application can be found [here](#discord-developer-portal).

This script is also a configuration script, and can be run to change your environment configuration.  Note that database names cannot be changed in MySQL after they have been created. 

## Dependencies
* Node.js `v12` or higher with npm
* MySQL `8` or higher **or** MariaDB `v10.5` or higher
* A Windows or Linux (Ubuntu and Debian tested) environment to run the bot

## Discord Developer Portal
To run a Discord bot, you must have a Discord application with the correct permissions, which can be created in the [Discord Developer Portal](https://discord.com/developers/applications).
1. On the top right of the site, click `New Application`.  Give your application a name and click `Create`
2. After the new application is created, select it and you will see a new screen with a *Settings* sidebar on the left. Open the **Bot** settings and click `Add Bot`.
3. Under the *Build-A-Bot* section in the **Bot** settings, click on `Reveal Token`.  Copy this token, you will need it later in the guide.
4. In **OAuth2** settings, select the *bot* scope with *Send Messages* and *Embed Links* permissions. A link that looks like this `https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_CLIENT_ID&permissions=18432&scope=bot` will appear, this is the link you will use to invite your bot to your Discord servers.
5. Invite the bot to your server.

**NOTE**: Do not share your Discord token publicly as it can be used maliciously to impersonate your bot.  If you suspect your token is compromised, click `Regenerate` to assign a new token to your bot.

## Download Files
Download a zip of the repository [here](https://github.com/nathanlytang/Steve/archive/master.zip) or use git to clone.
```bash
# Change directory (Assuming you are using Linux)
cd /opt

# Clone the Git repository from Github
git clone https://github.com/nathanlytang/Steve.git/
```

## Installation
Once the required files are installed, we need to install the Node.js dependencies and copy the environment variables file.
```bash
# Change directory (Assuming you are using Linux)
cd /opt/Steve/

# Copy the environment variables file
cp .env.example .env

# Install node.js dependencies
npm install
```

Edit the `.env` file in a text editor.  Place your Discord token that you grabbed earlier into the DISCORD_TOKEN variable.  Right click on the bot in your Discord server member list and click "Copy ID", then paste into the CLIENT_ID variable. Below is the file you will edit:
```ini
CLIENT_ID=<YOUR_BOT_CLIENT_ID>
DISCORD_TOKEN=<YOUR_DISCORD_BOT_TOKEN_HERE>

DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=stevebot
DB_USERNAME=stevebotuser
DB_PASSWORD=<DATABASE_PASSWORD_HERE>
```
**Note**: Remove the `<` and `>` signs when pasting your Discord token.


#### Extra Windows Setup
>Skip this section if you are hosting the bot on Linux.  If you are hosting the bot on Windows, a slight modification to the `package.json` file is required.  Below is the section you will modify:
>```json
>"scripts": {
>    "start": "node .",
>    "production": "NODE_ENV=production&&npm start",
>    "development": "NODE_ENV=development&&npm start"
>},
>```
>Open the `package.json` file in a text editor and change the line
>```json
>"production": "NODE_ENV=production&&npm start",
>```
>to 
>```json
>"production": "set NODE_ENV=production&&npm start",
>```
>then save and close the file.

## Database Setup
Steve stores all its information in a database. To set one up, follow [this short guide](db_setup.md).  Once the database has been setup, return here to continue.

Next, we will edit the `.env` file again.  This time, take the password you just created during database setup and edit this line with your new password:
```ini
DB_PASSWORD=<DATABASE_PASSWORD_HERE>
```

## Running the bot
The formal set up is complete!  All you need to do to start the bot is run the following command in the terminal:
```
npm run production
```

## Additional Configuration
Refer [here](additional_configuration.md) for additional configuration, including backups, and setting up background processes/autostart.