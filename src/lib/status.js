module.exports = {
    name: 'status',
    description: 'Get server status',
    execute(Discord, env, serverID, message, args, invite) {
        const fs = require('fs');
        const path = require("path");
        const Query = require('mcquery/lib');
        const mcping = require('mcping-js');
        const defaultFavicon = "../../assets/favicon.png";
        
        // Functions
        function statusCheckFail(message, err) {
            console.log(`Failed to fetch server info: ${err}`);
            const fetchFailEmbed = new Discord.MessageEmbed()
                .setColor('#E74C3C')
                .setTitle('Failed to get server information')
                .setDescription('Failed to get server information.  Please try again in a few minutes.')
            message.channel.send(fetchFailEmbed);
            return;
        }

        function offlineEmbed(message) {
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
            return;
        }

        // Start of command
        console.log(`Server ${serverID} (${message.guild.name}) sent status command`);

        if (env[serverID].url == "") { // Check if URL in env.json
            return message.channel.send(`Your server IP has not been set up!  Please use \`${env[serverID].prefix}setup\` to get the setup information.`);
        }

        if (env[serverID].query) { // Grab server information using query if querying enabled
            // Create a new query using the server IP/port
            var query = new Query(env[serverID].url, env[serverID].port);

            // Sends a query request to the server IP/port
            query.connect()
                .then(() => {
                    query.full_stat((err, stat) => {
                        if (err) {
                            statusCheckFail(message, err);
                        }

                        try {
                            // Send a ping request to the server IP/port to grab server icon
                            const ping = new mcping.MinecraftServer(env[serverID].url, env[serverID].port);
                            ping.ping(4000, -1, (pingErr, res) => {

                                // Convert base64 favion to buffer and include as attachment if server icon exists
                                if (pingErr || !res.favicon) {
                                    var imgAttach = path.join(__dirname, defaultFavicon);
                                } else {
                                    var image = Buffer.from(res.favicon.split(",")[1], 'base64');
                                    var imgAttach = new Discord.MessageAttachment(image, "favicon.png");
                                }

                                // Get player list
                                try {
                                    var playerList = 'No current players';
                                    if (stat.numplayers > 0 && stat.numplayers <= 20) {
                                        var playerList = ``;
                                        for (var i = 0; i < stat.numplayers; i++) {
                                            if (i % 4 == 0) {
                                                playerList += `\n`;
                                            }
                                            playerList += `${stat.player_[i]}, `;
                                        }
                                        playerList = playerList.substring(0, playerList.length - 2);
                                    } else if (stat.numplayers > 20) {
                                        var playerList = 'Too many to show!';
                                    }
                                } catch {
                                    console.log(`Server ${serverID} (${message.guild.name}): Player number does not match list`)
                                    if (stat.numplayers > 20) {
                                        var playerList = 'Too many to show!';
                                    } else {
                                        var playerList = 'Unknown';
                                    }
                                }

                                // Create and send server online embed
                                const statusEmbed = new Discord.MessageEmbed()
                                    .setColor('#2ECC71')
                                    .setTitle('Minecraft Server Status')
                                    .attachFiles([imgAttach])
                                    .addFields(
                                        { name: 'Status', value: `Online\n`, inline: true },
                                        { name: 'Version', value: `${stat.version}\n`, inline: true },
                                    )
                                    .setThumbnail('attachment://favicon.png')
                                    .addFields(
                                        { name: 'Players', value: `${stat.numplayers}/${stat.maxplayers}\n`, inline: true },
                                        { name: 'List', value: `${playerList}\n`, inline: true },
                                    )
                                    .setFooter(`${env[serverID].footer}`)
                                message.channel.send(statusEmbed);
                            })

                        } catch (err) {
                            statusCheckFail(message, err);
                        }
                        // Close query request when complete
                        if (query.outstandingRequests === 0) {
                            query.close()
                        }
                    });
                    return;
                })
                .catch(err => {
                    // Create and send server offline embed
                    offlineEmbed(message);
                    return;
                })
        } else { // Grab server information using ping if querying disabled
            try {
                // Send a ping request to the server IP/port to grab server icon
                const ping = new mcping.MinecraftServer(env[serverID].url, env[serverID].port);
                ping.ping(4000, -1, (pingErr, res) => {

                    // Send offline embed if ping error
                    if (pingErr) {
                        // Create and send server offline embed
                        offlineEmbed(message);
                        return;
                    }

                    // Convert base64 favion to buffer and include as attachment if server icon exists
                    if (!res.favicon) {
                        var imgAttach = path.join(__dirname, defaultFavicon);
                    } else {
                        var image = Buffer.from(res.favicon.split(",")[1], 'base64');
                        var imgAttach = new Discord.MessageAttachment(image, "favicon.png");
                    }

                    // Get player list
                    try {
                        var playerList = 'No current players';
                        if (res.players.online > 20) {
                            var playerList = 'Too many to show!';
                        } else if (res.players.online > 0 && res.players.online <= 20) {
                            var playerList = ``;
                            for (var i = 0; i < res.players.online; i++) {
                                if (i % 4 == 0) {
                                    playerList += `\n`;
                                }
                                playerList += `${res.players.sample[i].name}, `;
                            }
                            playerList = playerList.substring(0, playerList.length - 2);
                        }
                    } catch {
                        console.log(`Server ${serverID} (${message.guild.name}): Player number does not match list`)
                        var playerList = 'Unknown';
                    }

                    // Create and send server online embed
                    const statusEmbed = new Discord.MessageEmbed()
                        .setColor('#2ECC71')
                        .setTitle('Minecraft Server Status')
                        .attachFiles([imgAttach])
                        .addFields(
                            { name: 'Status', value: `Online\n`, inline: true },
                            { name: 'Version', value: `${res.version.name}\n`, inline: true },
                        )
                        .setThumbnail('attachment://favicon.png')
                        .addFields(
                            { name: 'Players', value: `${res.players.online}/${res.players.max}\n`, inline: true },
                            { name: 'List', value: `${playerList}\n`, inline: true },
                        )
                        .setFooter(`${env[serverID].footer}`)
                    message.channel.send(statusEmbed);
                    return;
                })

            } catch (err) {
                console.log(`Failed to fetch server info: ${err}`);
                const fetchFailEmbed = new Discord.MessageEmbed()
                    .setColor('#E74C3C')
                    .setTitle('Failed to get server information')
                    .setDescription('Failed to get server information.  Please try again in a few minutes.')
                message.channel.send(fetchFailEmbed);
                return;
            }
        }
    },
};