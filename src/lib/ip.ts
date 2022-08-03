import Discord, { PermissionFlagsBits } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import query from '../../db/query.js';
import { CommandOptions } from '../../types';

export const name = 'ip';
export const aliases = ['join'];
export const description = 'Get the server join IP';
export const data = new SlashCommandBuilder()
    .setName('ip')
    .setDescription('Get the Minecraft server address')
    .setDefaultMemberPermissions(PermissionFlagsBits.UseApplicationCommands)

export async function execute(options: CommandOptions) {
    const { pool, serverID, interaction } = options;
    console.log(`Server ${serverID} (${interaction.guild?.name}) sent ip command`);

    try {
        // Execute SQL
        const sql = "SELECT url, port, name FROM guild_data WHERE guild_id = ?;";
        const vars = [serverID];
        const rows = await query(pool, sql, vars);
        // Check if URL exists
        if (rows[0].url === '') {
            const noSettingsEmbed = new Discord.EmbedBuilder()
                .setColor('#E74C3C')
                .setAuthor({ name: 'Current Settings', iconURL: 'https://i.imgur.com/gb5oeQt.png' })
                .setDescription(`Steve has not been set up on this server yet! Run \`/setup\` to continue.`);
            return interaction.reply({ embeds: [noSettingsEmbed] });
        }

        // Display the port if not default
        const serverIP = rows[0].port === "25565" ? `${rows[0].url}` : `${rows[0].url}:${rows[0].port}`;

        // Create and send join embed
        const joinEmbed = new Discord.EmbedBuilder()
            .setColor('#62B36F')
            .setThumbnail(`https://eu.mc-api.net/v3/server/favicon/${rows[0].url}`)
            .setTitle(`Join the Server`)
            .setDescription(`Join ${rows[0].name} at **${serverIP}**!`);
        return interaction.reply({ embeds: [joinEmbed] });
    } catch (err) {
        // If failed to get server information from database
        console.log(err);
        const fetchFailEmbed = new Discord.EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('Failed to get server information')
            .setDescription('Failed to get server information.  Please try again in a few minutes.');
        return interaction.reply({ embeds: [fetchFailEmbed] });
    }
}