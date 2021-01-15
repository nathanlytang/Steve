module.exports = {
	name: 'leave',
    permissions: 'ADMINISTRATOR',
	description: 'Leave the server',
	execute(Discord, env, serverID, message, args, invite) {
        const fs = require('fs');
        const path = require("path");
        const data = "../env.json";

        console.log(`Server ${serverID} (${message.guild.name}) sent leave command`);
        
        (async () => {
            // Send leave embed
            const leaveEmbed = new Discord.MessageEmbed()
                .setColor('#62B36F')
                .setAuthor('Steve', 'https://i.imgur.com/gb5oeQt.png')
                .setDescription(`Goodbye! Click [here](${invite}) to invite me again.`)
            await message.channel.send(leaveEmbed);
            
            // Delete server properties from JSON and leave guild
            delete env[serverID];
            fs.writeFileSync(path.join(__dirname, data), JSON.stringify(env));
            console.log(`Left guild: ${message.guild.id} (${message.guild.name})`);
            message.guild.leave();
        })();
        return;
	},
};