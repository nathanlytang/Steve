const Discord = require('discord.js');
const fs = require('fs');
const path = require("path");
var env = JSON.parse(fs.readFileSync(path.join(__dirname, "env.json")));

const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setPresence({ activity: { name: '-status | -help', type: 'LISTENING' }, status: 'online' })
        // .then(console.log)
        .catch(console.error);
});


client.login(env.token);
