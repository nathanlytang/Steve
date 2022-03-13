import Discord from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { Permissions } from 'discord.js';
import query from '../../db/query';
import { CommandOptions } from '../../types/index';

export const name = 'settings';
export const permissions = new Permissions([Permissions.FLAGS.ADMINISTRATOR]);
export const description = 'Get server settings';
export const data = new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Display the current server settings')
    .setDefaultPermission(true);

export async function execute(options: CommandOptions) {
    const { pool, serverID, interaction } = options;
    console.log(`Server ${serverID} (${interaction.guild?.name}) sent settings command`);

    // Execute SQL
    try {
        const sql = "SELECT * FROM guild_data WHERE guild_id = ?;";
        const vars = [serverID];
        const rows = await query(pool, sql, vars);

        let serverName: string = rows[0].name;
        const serverPort: number = rows[0].port;
        const serverQuery: number = rows[0].query;
        let serverURL: string = rows[0].url;
        let serverFooter: string = rows[0].footer;

        // If guild not set up
        if ((serverName == "") && (serverURL == "") && (serverFooter == "")) {
            const noSettingsEmbed = new Discord.MessageEmbed()
                .setColor('#E74C3C')
                .setAuthor({ name: 'Current Settings', iconURL: 'https://i.imgur.com/gb5oeQt.png' })
                .setDescription(`Steve has not been set up on this server yet! Run \`/setup\` to continue.`);
            return interaction.reply({ embeds: [noSettingsEmbed] });
        }

        // Else display current settings
        if (serverName == "") { serverName = "None"; }
        if (serverURL == "") { serverURL = "None"; }
        if (serverFooter == "") { serverFooter = "None"; }
        const settingsEmbed = new Discord.MessageEmbed()
            .setColor('#62B36F')
            .setAuthor({ name: 'Current Settings', iconURL: 'https://i.imgur.com/gb5oeQt.png' })
            .addFields(
                { name: 'Server', value: `${serverName}`, inline: true },
                { name: 'IP address', value: `${serverURL}`, inline: true },
                { name: 'Port', value: `${serverPort}`, inline: true },
                { name: 'Query', value: `${serverQuery ? "Enabled" : "Disabled"}`, inline: true },
                { name: 'Footer', value: `${serverFooter}`, inline: true }
            );
        return interaction.reply({ embeds: [settingsEmbed] });

    } catch (err) {
        // If failed to get server information from database
        console.error(`Failed to fetch server info: ${err}`);
        const fetchFailEmbed = new Discord.MessageEmbed()
            .setColor('#E74C3C')
            .setTitle('Failed to get server information')
            .setDescription('Failed to get server information.  Please try again in a few minutes.');
        return interaction.reply({ embeds: [fetchFailEmbed] });
    }
}