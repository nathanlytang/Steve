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

client.on("guildCreate", (guild) => {
    // When the bot joins a server
    console.log(`Joined new guild: ${guild.id} (${guild.name})`);

    // Add server ID to env.json
    const env = JSON.parse(fs.readFileSync(path.join(__dirname, "env.json")));
    const serverID = guild.id.toString();
    var newGuild = { prefix: "-mc ", url: "", serverName: "", footer: "" };
    env[serverID] = newGuild;
    fs.writeFileSync(path.join(__dirname, "env.json"), JSON.stringify(env));
});

client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return; // Check if message has bot prefix and message not sent by bot
    if (message.channel.type == "dm") return; // Ignore direct messages

    const serverID = message.guild.id.toString();
    const env = JSON.parse(fs.readFileSync(path.join(__dirname, "env.json")));

    const commandBody = message.content.slice(prefix.length);
    const args = commandBody.split(' ');
    const command = args.shift().toLowerCase();

    if (command === 'help') {
        console.log(`Server ${serverID} (${message.guild.name}) sent help command`);

        // Create and send help embed
        const helpEmbed = new Discord.MessageEmbed()
            .setColor('#62B36F')
            .setAuthor('Steve', 'https://i.imgur.com/gb5oeQt.png')
            .setDescription(`Steve is a Discord bot for Minecraft communities!\nMake it easy to get your server IP and server status.`)
            .addFields(
                { name: 'Commands', value: `${prefix}help\n${prefix}setup\n${prefix}status\n${prefix}ip\n${prefix}skin <user>\n`, inline: true },
                { name: '\u200B', value: '\u200B', inline: true },
                { name: 'Description', value: 'Display this message\nDisplay setup instructions\nGet the server status\nGet the server IP address\nGet a username\'s MC skin\n', inline: true },
            )
            .addField( 'Invite', `Invite me to your Discord server [here](https://discord.com/api/oauth2/authorize?client_id=773117222380896276&permissions=8&scope=bot).\u200B`)
            .setFooter('Made by Alienics 👾')
        message.channel.send(helpEmbed);
    }

    if (command === 'status') {
        console.log(`Server ${serverID} (${message.guild.name}) sent status command`);

        if (env[serverID].url == "") { //Check if URL in env.json
            return message.channel.send('Your server IP has not been set up!  Please specify using `-mc setup ip <SERVER IP>`.');
        }

        (async () => {
            // Get status from API
            const response = await fetch(`https://eu.mc-api.net/v3/server/ping/${env[serverID].url}`,);
            const status = await response.json();

            // Check status
            if (status.status && status.online) {

                // Get player list
                var playerList = 'No current players';
                if (status.players.online > 0 && status.players.online <= 20) {
                    var playerList = ``;
                    for (var i = 0; i < status.players.online; i++) {
                        if (i % 4 == 0) {
                            playerList += `\n`;
                        }
                        playerList += `${status.players.sample[i].name}, `;
                    }
                    playerList = playerList.substring(0, playerList.length - 2);
                } else if (status.players.online > 20) {
                    var playerList = 'Too many to show!';
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
                message.channel.send(statusEmbed);
            }
        })();
    }

    if (command === 'skin') {
        console.log(`Server ${serverID} (${message.guild.name}) sent skin command`);

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
        console.log(`Server ${serverID} (${message.guild.name}) sent ip command`);

        // Create and send join embed
        const joinEmbed = new Discord.MessageEmbed()
            .setColor('#62B36F')
            .setThumbnail(`https://eu.mc-api.net/v3/server/favicon/${env[serverID].url}`)
            .setTitle(`Join the Server`)
            .setDescription(`Join ${env[serverID].serverName} at **${env[serverID].url}**!`)
        message.channel.send(joinEmbed);
    }

    if (command === 'setup') {
        console.log(`Server ${serverID} (${message.guild.name}) sent setup command`);

        if (!message.member.hasPermission("ADMINISTRATOR")) { // Check if author is admin
            return message.channel.send('Only administrators can make changes to Steve!');
        }

        if (args.length == 0) { // Display setup instructions
            const setupEmbed = new Discord.MessageEmbed()
                .setColor('#62B36F')
                .setAuthor('Steve Setup Instructions', 'https://i.imgur.com/gb5oeQt.png')
                .setDescription(`Follow these commands to set me up for your server!`)
                .addFields(
                    { name: 'Commands', value: `${prefix}setup ip <Server IP>\n${prefix}setup name <Server name>\n${prefix}setup footer <Footer message>\n\u200B`, inline: true },
                    { name: '\u200B', value: '\u200B', inline: true },
                    { name: 'Description', value: 'Set the server IP (IP or URL accepted)\nSet your server name\nSet a footer message\n\u200B', inline: true },
                )
            return message.channel.send(setupEmbed);
        }

        if (args[0] === 'ip') { // Setup IP address / URL
            try {
                // Get IP address from argument and send to JSON
                env[serverID].url = args[1];
                fs.writeFileSync(path.join(__dirname, "env.json"), JSON.stringify(env));
                console.log(`Successfully set up IP for server ${serverID}`);
                return message.channel.send(`Server IP of \`${args[1]}\` successfully set!`);
            }
            catch (err) {
                console.log(`\x1b[31m\x1b[1mError setting IP for server ${serverID} (${message.guild.name}):\x1b[0m`);
                console.log(err);
                return message.channel.send(`Error setting IP!`);
            }
        }

        if (args[0] === 'name') { // Setup server name
            try {
                // Get server name from arguments
                var name = ``;
                for (i = 1; i < args.length; i++) {
                    name += `${args[i]} `;
                }
                name = name.substring(0, name.length - 1);
                // Send server name to JSON and return
                env[serverID].serverName = name;
                fs.writeFileSync(path.join(__dirname, "env.json"), JSON.stringify(env));
                console.log(`Successfully set up name for server ${serverID}`);
                return message.channel.send(`Server name of \`${name}\` successfully set!`);
            }
            catch (err) {
                console.log(`\x1b[31m\x1b[1mError setting name for server ${serverID} (${message.guild.name}):\x1b[0m`);
                console.log(err);
                return message.channel.send(`Error setting name!`);
            }
        }

        if (args[0] === 'footer') { // Setup footer
            try {
                // Get footer message from arguments
                var footerMessage = ``;
                for (i = 1; i < args.length; i++) {
                    footerMessage += `${args[i]} `;
                }
                footerMessage = footerMessage.substring(0, footerMessage.length - 1);
                // Send footer to JSON and return
                env[serverID].footer = footerMessage;
                fs.writeFileSync(path.join(__dirname, "env.json"), JSON.stringify(env));
                console.log(`Successfully set up footer for server ${serverID}`);
                return message.channel.send(`Server footer of \`${footerMessage}\` successfully set!`);
            }
            catch (err) {
                console.log(`\x1b[31m\x1b[1mError setting footer for server ${serverID} (${message.guild.name}):\x1b[0m`);
                console.log(err);
                return message.channel.send(`Error setting footer!`);
            }
        }
    }

});

client.login(auth.token); // Bot authentication token
