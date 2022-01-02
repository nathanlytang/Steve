import Discord from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

export const name = 'help';
export const aliases = ['commands'];
export const description = 'Steve Help Command';
export const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get command information for Steve')
    .setDefaultPermission(true);

export function execute(pool, serverID, interaction, invite) {
    console.log(`Server ${serverID} (${interaction.guild.name}) sent help command`);

    // Create and send help embed
    const helpEmbed = new Discord.MessageEmbed()
        .setColor('#62B36F')
        .setAuthor({ name: 'Steve', iconURL: 'https://i.imgur.com/gb5oeQt.png' })
        .setDescription(`Steve is a Discord bot for Minecraft communities! Make it easy \nto get your server address and server status all in one panel.`)
        .addFields(
            { name: 'Commands', value: `/help\n/setup\n/settings\n/status\n/ip\n/skin <user>\n/leave\n`, inline: true },
            // { name: '\u200B', value: '\u200B', inline: true },
            { name: 'Description', value: 'Display this message\nDisplay setup instructions\nDisplay current settings\nGet the server status\nGet the server IP address\nGet a username\'s MC skin\nSteve will leave the server\n', inline: true }
        )
        .addField('Invite', `Invite me to your Discord server [here](${invite} "Invite Steve").\u200B`)
        .setFooter({ text: 'Made by Alienics#5796 👾' });
    return interaction.reply({ embeds: [helpEmbed] });
}