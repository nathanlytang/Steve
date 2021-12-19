import { SlashCommandBuilder } from "@discordjs/builders";

export const name = 'leave';
export const permissions = 'ADMINISTRATOR';
export const description = 'Leave the server';
export const data = new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Trigger Steve to leave this Discord server');
export function execute(Discord, pool, serverID, message, args, invite, prefix) {
    console.log(`Server ${serverID} (${message.guild.name}) sent leave command`);

    (async () => {
        // Send leave embed
        const leaveEmbed = new Discord.MessageEmbed()
            .setColor('#62B36F')
            .setAuthor('Steve', 'https://i.imgur.com/gb5oeQt.png')
            .setDescription(`Goodbye! Click [here](${invite} "Invite Steve") to invite me again.`);
        await message.channel.send({ embeds: [leaveEmbed] });
        message.guild.leave();
    })();
    return;
}