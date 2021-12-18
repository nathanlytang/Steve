export const name = 'skin';
export const description = 'Get player skin';
export async function execute(Discord, pool, serverID, message, args, invite, prefix) {
    const fetch = (await import('node-fetch')).default;

    console.log(`Server ${serverID} (${message.guild.name}) sent skin command`);

    if (args.length == 0) {
        return message.channel.send(`You did not provide a username, ${message.author}!`);
    } else if (args.length > 1) {
        return message.channel.send(`Too many arguments provided! Please input only one username, ${message.author}`);
    }

    // Get UUID from API
    const response = await fetch(`https://playerdb.co/api/player/minecraft/${args[0]}`);
    try {
        var playerInfo = await response.json();
    } catch (err) {
        console.log(`Failed to fetch player skin: ${err}`);
        const fetchFailEmbed = new Discord.MessageEmbed()
            .setColor('#E74C3C')
            .setTitle('Failed to get player skin')
            .setDescription('Failed to get player skin.  Please try again in a few minutes.');
        message.channel.send(fetchFailEmbed);
        return;
    }

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
            { name: 'Download', value: `To download this skin, click [here](https://minecraft.tools/download-skin/${playerInfo.data.player.username} "${playerInfo.data.player.username}'s skin").\n`, inline: true }
        );
    message.channel.send(skinEmbed);

    return;
}