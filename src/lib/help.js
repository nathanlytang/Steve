module.exports = {
    name: 'help',
    aliases: ['commands'],
	description: 'Steve Help Command',
	execute(Discord, pool, serverID, message, args, invite, prefix) {
        console.log(`Server ${serverID} (${message.guild.name}) sent help command`);

        // Create and send help embed
        const helpEmbed = new Discord.MessageEmbed()
            .setColor('#62B36F')
            .setAuthor('Steve', 'https://i.imgur.com/gb5oeQt.png')
            .setDescription(`Steve is a Discord bot for Minecraft communities! Make it easy \nto get your server address and server status all in one panel.`)
            .addFields(
                { name: 'Commands', value: `${prefix}help\n${prefix}setup\n${prefix}settings\n${prefix}status\n${prefix}ip\n${prefix}skin <user>\n${prefix}leave\n`, inline: true },
                // { name: '\u200B', value: '\u200B', inline: true },
                { name: 'Description', value: 'Display this message\nDisplay setup instructions\nDisplay current settings\nGet the server status\nGet the server IP address\nGet a username\'s MC skin\nSteve will leave the server\n', inline: true },
            )
            .addField('Invite', `Invite me to your Discord server [here](${invite} "Invite Steve").\u200B`)
            .setFooter('Made by Alienics#5796 👾')
        message.channel.send(helpEmbed);
        return;
	},
};