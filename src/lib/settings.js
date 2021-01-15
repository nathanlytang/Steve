module.exports = {
	name: 'settings',
    permissions: 'ADMINISTRATOR',
	description: 'Get server settings',
	execute(Discord, env, serverID, message, args, invite) {
        console.log(`Server ${serverID} (${message.guild.name}) sent settings command`);

        let serverName = env[serverID].serverName;
        let serverPort = env[serverID].port;
        let serverQuery = env[serverID].query;
        let serverURL = env[serverID].url;
        let serverFooter = env[serverID].footer;

        if (serverQuery) {
            serverQuery = "Enabled";
        } else if (!serverQuery) {
            serverQuery = "Disabled";
        }

        // If guild not set up
        if ((serverName == "") && (serverURL == "") && (serverFooter == "")) {
            const noSettingsEmbed = new Discord.MessageEmbed()
                .setColor('#E74C3C')
                .setAuthor('Current Settings', 'https://i.imgur.com/gb5oeQt.png')
                .setDescription(`Steve has not been set up on this server yet! Run \`${prefix}setup\` continue.`)
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
            )
        message.channel.send(settingsEmbed);
        return;
	},
};