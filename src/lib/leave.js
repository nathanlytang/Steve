module.exports = {
	name: 'leave',
    permissions: 'ADMINISTRATOR',
	description: 'Leave the server',
	execute(Discord, pool, serverID, message, args, invite, prefix) {
        console.log(`Server ${serverID} (${message.guild.name}) sent leave command`);
        
        (async () => {
            // Send leave embed
            const leaveEmbed = new Discord.MessageEmbed()
                .setColor('#62B36F')
                .setAuthor('Steve', 'https://i.imgur.com/gb5oeQt.png')
                .setDescription(`Goodbye! Click [here](${invite}) to invite me again.`)
            await message.channel.send(leaveEmbed);
            message.guild.leave();
        })();
        return;
	},
};