import Discord, { PermissionFlagsBits, PermissionsBitField } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { Permissions } from 'discord.js';
import { CommandOptions } from '../../types';

export const name = 'leave';
export const permissions = PermissionsBitField.Flags.Administrator;
export const description = 'Leave the server';
export const data = new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Trigger Steve to leave this Discord server')
    .setDefaultMemberPermissions(PermissionFlagsBits.UseApplicationCommands)

export async function execute(options: CommandOptions) {
    const { serverID, interaction, invite } = options;
    console.log(`Server ${serverID} (${interaction.guild?.name}) sent leave command`);

    // Send leave embed
    const leaveEmbed = new Discord.EmbedBuilder()
        .setColor('#62B36F')
        .setAuthor({ name: 'Steve', iconURL: 'https://i.imgur.com/gb5oeQt.png' })
        .setDescription(`Goodbye! Click [here](${invite} "Invite Steve") to invite me again.`);
    await interaction.reply({ embeds: [leaveEmbed] });
    return interaction.guild?.leave();
}