module.exports = {
    name: 'ip',
    aliases: ['join'],
	description: 'Get the server join IP',
	execute(Discord, env, serverID, message, args, invite) {
        console.log(`Server ${serverID} (${message.guild.name}) sent ip command`);

        // Display the port if not default
        let serverIP = `${env[serverID].url}:${env[serverID].port}`;
        if (env[serverID].port == "25565") {
            serverIP = `${env[serverID].url}`;
        }

        // Create and send join embed
        const joinEmbed = new Discord.MessageEmbed()
            .setColor('#62B36F')
            .setThumbnail(`https://eu.mc-api.net/v3/server/favicon/${env[serverID].url}`)
            .setTitle(`Join the Server`)
            .setDescription(`Join ${env[serverID].serverName} at **${serverIP}**!`)
        message.channel.send(joinEmbed);
        return;
	},
};