# Getting Started

The following document is a tutorial on how to host the bot yourself.  [Click here](https://discord.com/oauth2/authorize?client_id=773117222380896276&permissions=2147502080&scope=applications.commands%20bot) to invite the bot if you do not wish to self host.

There are three ways to deploy: via the [install script](#install-script), [Docker](#docker--manual-installation), or [manually](#docker--manual-installation).  Before proceeding with any of the deployment methods, you must create the Discord application.  Follow the [Discord Developer Portal](#discord-developer-portal) steps below.

## Discord Developer Portal
To run a Discord bot, you must have a Discord application with the correct permissions, which can be created in the [Discord Developer Portal](https://discord.com/developers/applications).
1. On the top right of the site, click `New Application`.  Give your application a name and click `Create`
2. After the new application is created, select it and you will see a new screen with a *Settings* sidebar on the left. Open the **Bot** settings and click `Add Bot`.
3. Under the *Build-A-Bot* section in the **Bot** settings, click on `Reveal Token`.  Copy this token, you will need it later in the guide.
4. In **OAuth2 General**, look for *CLIENT ID*.  Make note of this ID, as you will need it later.
5. In **OAuth2 URL Generator** settings, select the *application.commands* scope and the *bot* scope with *Send Messages*, *Embed Links*, and *Use Slash Commands* permissions. A link that looks like this `https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_CLIENT_ID&permissions=2147502080&scope=applications.commands%20bot` will appear, this is the link you will use to invite your bot to your Discord servers.
6. Invite the bot to your server.

> **Warning**:
> Do not share your Discord token publicly as it can be used maliciously to impersonate your bot.  If you suspect your token is compromised, click `Reset Token` to assign a new token to your bot.

## Dependencies
Docker Setup Dependencies
* Docker with Docker Compose

Manual Setup/Install Script Dependencies
* `Node.js v18` or higher with npm
* `MySQL 8` or higher **or** `MariaDB v10.5` or higher
* A Windows or Linux (Ubuntu and Debian tested) environment to run the bot

## Install Script
A script is [available here](https://raw.githubusercontent.com/nathanlytang/Steve/master/scripts/setup.sh) for Linux installations.  If you are using Windows or do not wish to use this script, skip to the next section.

> **Note**:
> The Discord application still must be created manually on the [Discord Developer Portal](https://discord.com/developers/applications). The guide on setting up a Discord application can be found [here](#discord-developer-portal).

To use this script, run this command with **root access**:
```bash
wget -q https://raw.githubusercontent.com/nathanlytang/Steve/master/scripts/setup.sh && sudo ./setup.sh
```

After completing the setup script, you can skip to the [running your bot](#running-the-bot) section.

This script is also a configuration script, and can be run to change your environment configuration.  Note that database names cannot be changed in MySQL after they have been created. 

## Docker / Manual Installation

**The next two sections are required for both Docker and manual installations.**

### Download Files
Download a zip of the repository [here](https://github.com/nathanlytang/Steve/archive/master.zip) or use Git to clone.
```bash
# Change directory (Assuming you are using Linux)
cd /opt

# Clone the Git repository from Github
git clone https://github.com/nathanlytang/Steve.git/
```
### Add Environment Variables
Once the required files are installed, we need to create our environment variables.
```bash
# Change directory (Assuming you are using Linux)
cd /opt/Steve/

# Copy the environment variables file
cp .env.example .env
```

Edit the `.env` file in a text editor.  Place your Discord token that you grabbed earlier into the `DISCORD_TOKEN` variable.  Place the client ID that you got earlier into the `CLIENT_ID` variable. If you plan on using Docker, you will also have to fill out `DB_ROOT_PASSWORD`.

Below is the file you will edit:
```ini
CLIENT_ID=<YOUR_BOT_CLIENT_ID>
DISCORD_TOKEN=<YOUR_DISCORD_BOT_TOKEN_HERE>

DB_HOST=127.0.0.1
DB_PORT=3306 # Change the port if it is unavailable on your system
DB_DATABASE=stevebot
DB_USERNAME=stevebotuser
DB_PASSWORD=<DATABASE_PASSWORD_HERE>
DB_ROOT_PASSWORD=<MYSQL_DATABASE_ROOT_PASSWORD_HERE> # Docker only
```
> **Note**:
> Remove the `<` and `>` signs when pasting your Discord token.

**At this point, the steps required for both Docker and manual installation has been completed.  Choose your path below:**

---

### Docker
For easy deployment, we can take advantage of Docker Compose. If you do not wish to use Docker, you can skip this step.  If you install with Docker, then you can ignore all the steps after this section.

1. Ensure the steps above were completed
2. Run `docker compose up`
3. That's it!  Docker takes care of database setup, your bot should now be available

> **Note**:
> Due to Discord's slow public slash command registration, it may take up to an hour before commands are available on the first run of the bot.  Subsequent startups of the bot will have commands instantly available.

---

### Manual
Next, we need to install the Node.js dependencies.
```bash
# Install Node.js dependencies and build
npm install
npm run build
```

### Database Setup
Steve stores all its information in a database. To set one up, follow [this short guide](db_setup.md).  Once the database has been setup, return here to continue.

Next, we will edit the `.env` file again.  This time, take the password you just created during database setup and edit this line with your new password:
```ini
DB_PASSWORD=<DATABASE_PASSWORD_HERE>
```

### Running the bot
The formal set up is complete!  All you need to do to start the bot is run the following command in the terminal:
```
npm run production
```

> **Note**:
> Due to Discord's slow public slash command registration, it may take up to an hour before commands are available on the first run of the bot.  Subsequent startups of the bot will have commands instantly available.

### Additional Configuration
Refer [here](additional_configuration.md) for additional configuration, including backups, and setting up background processes/autostart.