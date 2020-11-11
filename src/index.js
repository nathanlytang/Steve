const Discord = require('discord.js');
const fs = require('fs');
const path = require("path");
const fetch = require('node-fetch');
const env = JSON.parse(fs.readFileSync(path.join(__dirname, "env.json")));
const auth = JSON.parse(fs.readFileSync(path.join(__dirname, "auth.json")));
const prefix = '-mc ';

const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setPresence({ activity: { name: '-status | -help', type: 'LISTENING' }, status: 'online' })
        // .then(console.log)
        .catch(console.error);
});

client.on('message', message => {
    if (!message.content.startsWith(prefix)) return; // Check if message has bot prefix

    const commandBody = message.content.slice(prefix.length);
    const args = commandBody.split(' ');
    const command = args.shift().toLowerCase();

    if (command === 'help') {
        // Create and send embed
        const helpEmbed = new Discord.MessageEmbed()
            .setColor('#62B36F')
            .setAuthor('Steve', 'https://i.imgur.com/gb5oeQt.png')
            .setDescription(`Steve is a Discord bot for Minecraft communities!\nMake it easy to get your server IP and server status.`)
            .addFields(
                { name: 'Commands', value: '-mc help\n-mc status\n-mc ip\n\u200B', inline: true },
                { name: '\u200B', value: '\u200B', inline: true },
                { name: 'Description', value: 'Display this message\nGet the server status\nGet the server IP address\n\u200B', inline: true },
            )
            .setFooter('Made by Alienics 👾')
        message.channel.send(helpEmbed);
    }
});

client.login(auth.token);
