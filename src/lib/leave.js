import Discord from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { Permissions } from 'discord.js';

export const name = 'leave';
export const permissions = new Permissions([Permissions.FLAGS.ADMINISTRATOR]);
export const description = 'Leave the server';
export const data = new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Trigger Steve to leave this Discord server')
    .setDefaultPermission(true);

export function execute(pool, serverID, interaction, invite) {
    console.log(`Server ${serverID} (${interaction.guild.name}) sent leave command`);

    (async () => {
        // Send leave embed
        const leaveEmbed = new Discord.MessageEmbed()
            .setColor('#62B36F')
            .setAuthor({ name: 'Steve', iconURL: 'https://i.imgur.com/gb5oeQt.png' })
            .setDescription(`Goodbye! Click [here](${invite} "Invite Steve") to invite me again.`);
        await interaction.reply({ embeds: [leaveEmbed] });
        interaction.guild.leave();
    })();
    return;
}