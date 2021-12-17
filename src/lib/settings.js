module.exports = {
    name: 'settings',
    permissions: 'ADMINISTRATOR',
    description: 'Get server settings',
    execute(Discord, pool, serverID, message, args, invite, prefix) {
        const SQL_Query = require('../../db/query');
        console.log(`Server ${serverID} (${message.guild.name}) sent settings command`);

        let serverName;
        let serverPort;
        let serverQuery;
        let serverURL;
        let serverFooter;

        // Execute SQL
        let sql = "SELECT * FROM guild_data WHERE guild_id = ?;";
        let vars = [serverID];
        var settings = new SQL_Query(pool, sql, vars);
        settings.query()
            .then((rows) => {
                serverName = rows[0].name;
                serverPort = rows[0].port;
                serverQuery = rows[0].query;
                serverURL = rows[0].url;
                serverFooter = rows[0].footer;
            })
            .then(() => {
                if (serverQuery == 1) {
                    serverQuery = "Enabled";
                } else {
                    serverQuery = "Disabled";
                }

                // If guild not set up
                if ((serverName == "") && (serverURL == "") && (serverFooter == "")) {
                    const noSettingsEmbed = new Discord.MessageEmbed()
                        .setColor('#E74C3C')
                        .setAuthor('Current Settings', 'https://i.imgur.com/gb5oeQt.png')
                        .setDescription(`Steve has not been set up on this server yet! Run \`${prefix}setup\` to continue.`);
                    return message.channel.send(noSettingsEmbed);
                }

                // Else display current settings
                if (serverName == "") { serverName = "None"; }
                if (serverURL == "") { serverURL = "None"; }
                if (serverFooter == "") { serverFooter = "None"; }
                const settingsEmbed = new Discord.MessageEmbed()
                    .setColor('#62B36F')
                    .setAuthor('Current Settings', 'https://i.imgur.com/gb5oeQt.png')
                    .addFields(
                        { name: 'Server', value: `${serverName}`, inline: true },
                        { name: 'IP address', value: `${serverURL}`, inline: true },
                        { name: 'Port', value: `${serverPort}`, inline: true },
                        { name: 'Query', value: `${serverQuery}`, inline: true },
                        { name: 'Footer', value: `${serverFooter}`, inline: true },
                    );
                message.channel.send(settingsEmbed);
                return;
            })
            .catch((err) => {
                // If failed to get server information from database
                console.log(`Failed to fetch server info: ${err}`);
                const fetchFailEmbed = new Discord.MessageEmbed()
                    .setColor('#E74C3C')
                    .setTitle('Failed to get server information')
                    .setDescription('Failed to get server information.  Please try again in a few minutes.');
                message.channel.send(fetchFailEmbed);
                return;
            });

    },
};