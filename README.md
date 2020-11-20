<p align="center"><img width=100 src="assets/logo.png"></p>
<h1 align="center">Steve.</h1>
<h3 align="center">A Minecraft Server Status Panel</h3>
<p align="center">
    <a href="https://github.com/nathanlytang/Steve" alt="Version"><img src="https://img.shields.io/github/package-json/v/nathanlytang/Steve"/></a>
    <a href="https://github.com/nathanlytang/Steve" alt="License"><img src="https://img.shields.io/github/license/nathanlytang/Steve"/></a>
    <a href="https://github.com/nathanlytang/Steve" alt="Language"><img src="https://img.shields.io/github/languages/top/nathanlytang/Steve"/></a>   
</p>
---
Steve is a Discord bot that tracks your Minecraft servers.  Built in the Node.js environment and the [discord.js](https://discord.js.org/#/) library, Steve aims to provide an easily accessible and well displayed status panel for your server.

### Invite
Invite Steve to your Discord server [here](https://discord.com/api/oauth2/authorize?client_id=773117222380896276&permissions=8&scope=bot).  Run `-mc setup` and follow the setup instructions.

1. In your `server.properties` file, set `enable-query` to `true` and restart the server.
2. `-mc setup ip <SERVER IP>` | Set the server IP (URL also accepted)      
3. `-mc setup name <SERVER NAME>` | Give your server a name          
4. `-mc setup footer <FOOTER MESSAGE>` | Set a footer message for your status panel

Setup is complete!  Run `-mc status` to display the server status panel.  More commands can be found by typing `-mc help` in your Discord server.

### Self Host
Alternatively, follow these steps to self host:
1. Create a new application in the [Discord Developer Portal](https://discord.com/developers/applications).
2. Clone the repository and `npm install`
3. Create an `env.json` and an `auth.json` file.  
4. In `auth.json`: copy and paste this `{"token": "EXAMPLE_AUTHENTICATION_KEY"}` and replace with the token from your new application (Application>Bot>Token).
5. Invite your bot and follow the same Invite instructions above.