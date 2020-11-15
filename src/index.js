const Discord = require('discord.js');
const fs = require('fs');
const path = require("path");
const fetch = require('node-fetch');
const auth = JSON.parse(fs.readFileSync(path.join(__dirname, "auth.json")));
const prefix = '-mc ';

const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setPresence({ activity: { name: `${prefix}status | ${prefix}help`, type: 'LISTENING' }, status: 'online' })
        // .then(console.log)
        .catch(console.error);
});

client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return; // Check if message has bot prefix and message not sent by bot

    const serverID = message.guild.id.toString();
    const env = JSON.parse(fs.readFileSync(path.join(__dirname, "env.json")));

    const commandBody = message.content.slice(prefix.length);
    const args = commandBody.split(' ');
    const command = args.shift().toLowerCase();

    if (command === 'help') {
        console.log(`Server ${serverID} sent help command`);

        // Create and send help embed
        const helpEmbed = new Discord.MessageEmbed()
            .setColor('#62B36F')
            .setAuthor('Steve', 'https://i.imgur.com/gb5oeQt.png')
            .setDescription(`Steve is a Discord bot for Minecraft communities!\nMake it easy to get your server IP and server status.`)
            .addFields(
                { name: 'Commands', value: `${prefix}help\n${prefix}status\n${prefix}ip\n${prefix}skin <user>\n\u200B`, inline: true },
                { name: '\u200B', value: '\u200B', inline: true },
                { name: 'Description', value: 'Display this message\nGet the server status\nGet the server IP address\nGet a username\'s MC skin\n\u200B', inline: true },
            )
            .setFooter('Made by Alienics 👾')
        message.channel.send(helpEmbed);
    }

    if (command === 'status') {
        console.log(`Server ${serverID} sent status command`);

        (async () => {
            // Get status from API
            const response = await fetch(`https://eu.mc-api.net/v3/server/ping/${env[serverID].url}`,);
            const status = await response.json();

            // Check status
            if (status.status && status.online) {

                // Get player list
                var playerList = 'No current players';
                if (status.players.online > 0) {
                    var playerList = ``;
                    for (var i = 0; i < status.players.online; i++) {
                        if (i % 4 == 0) {
                            playerList += `\n`;
                        }
                        playerList += `${status.players.sample[i].name}, `;
                    }
                    playerList = playerList.substring(0, playerList.length - 2);
                }

                // Create and send server online embed
                const statusEmbed = new Discord.MessageEmbed()
                    .setColor('#2ECC71')
                    .setTitle('Minecraft Server Status')
                    .addFields(
                        { name: 'Status', value: `Online\n`, inline: true },
                        { name: 'Version', value: `${status.version.name}\n`, inline: true },
                    )
                    .setThumbnail(`https://eu.mc-api.net/v3/server/favicon/${env[serverID].url}`)
                    .addFields(
                        { name: 'Players', value: `${status.players.online}/${status.players.max}\n`, inline: true },
                        { name: 'List', value: `${playerList}\n`, inline: true },
                    )
                    .setFooter(`${env[serverID].footer}`)
                message.channel.send(statusEmbed);

            } else {

                // Create and send server offline embed
                const statusEmbed = new Discord.MessageEmbed()
                    .setColor('#E74C3C')
                    .setTitle('Server Status')
                    .addFields(
                        { name: 'Status', value: `Offline\n`, inline: true },
                        { name: 'Version', value: `Unkown\n`, inline: true },
                    )
                    .addFields(
                        { name: 'Players', value: `None\n`, inline: true },
                    )
                    .setFooter(`${env[serverID].footer}`)
                message.channel.send(statusEmbed);
            }
        })();
    }

    if (command === 'skin') {
        console.log(`Server ${serverID} sent skin command`);

        if (args.length == 0) {
            return message.channel.send(`You didn't provide a username, ${message.author}!`);
        } else if (args.length > 1) {
            return message.channel.send(`Too many arguments! Please input only one username, ${message.author}`);
        }

        (async () => {
            // Get UUID from API
            const response = await fetch(`https://playerdb.co/api/player/minecraft/${args[0]}`,);
            const playerInfo = await response.json();

            if (playerInfo.code === 'minecraft.api_failure') {
                return message.channel.send(`${args[0]} is not a valid Minecraft username, ${message.author}!`);
            }

            // Create and send skin grab embed
            const skinEmbed = new Discord.MessageEmbed()
                .setColor('#62B36F')
                .setTitle(`${playerInfo.data.player.username}'s Minecraft Skin`)
                .setThumbnail(`https://crafatar.com/renders/body/${playerInfo.data.player.id}?overlay=true`)
                .setImage(`https://crafatar.com/skins/${playerInfo.data.player.id}`)
                .addFields(
                    { name: 'Download', value: `To download this skin, click [here](https://minecraft.tools/download-skin/${playerInfo.data.player.username} "${playerInfo.data.player.username}'s skin").\n`, inline: true },
                )
            message.channel.send(skinEmbed);

        })();
    }

    if (command === 'ip' || command === 'join') { // Get server IP address
        console.log(`Server ${serverID} sent ip command`);

        // Create and send join embed
        const joinEmbed = new Discord.MessageEmbed()
            .setColor('#62B36F')
            .setThumbnail(`https://eu.mc-api.net/v3/server/favicon/${env[serverID].url}`)
            .setTitle(`Join the Server`)
            .setDescription(`Join ${env[serverID].serverName} at **${env[serverID].url}**!`)
        message.channel.send(joinEmbed);
    }

});

client.login(auth.token); // Bot authentication token
