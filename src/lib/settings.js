import Discord from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { Permissions } from 'discord.js';
import SQL_Query from '../../db/query.js';

export const name = 'settings';
export const permissions = new Permissions([Permissions.FLAGS.ADMINISTRATOR]);
export const description = 'Get server settings';
export const data = new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Display the current server settings')
    .setDefaultPermission(true);

export async function execute(pool, serverID, interaction, invite) {
    console.log(`Server ${serverID} (${interaction.guild.name}) sent settings command`);

    let serverName;
    let serverPort;
    let serverQuery;
    let serverURL;
    let serverFooter;

    // Execute SQL
    let sql = "SELECT * FROM guild_data WHERE guild_id = ?;";
    let vars = [serverID];
    var settings = new SQL_Query(pool, sql, vars);
    settings.query()
        .then((rows) => {
            serverName = rows[0].name;
            serverPort = rows[0].port;
            serverQuery = rows[0].query;
            serverURL = rows[0].url;
            serverFooter = rows[0].footer;
        })
        .then(() => {
            if (serverQuery == 1) {
                serverQuery = "Enabled";
            } else {
                serverQuery = "Disabled";
            }

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
                    { name: 'Query', value: `${serverQuery}`, inline: true },
                    { name: 'Footer', value: `${serverFooter}`, inline: true }
                );
            interaction.reply({ embeds: [settingsEmbed] });
            return;
        })
        .catch((err) => {
            // If failed to get server information from database
            console.error(`Failed to fetch server info: ${err}`);
            const fetchFailEmbed = new Discord.MessageEmbed()
                .setColor('#E74C3C')
                .setTitle('Failed to get server information')
                .setDescription('Failed to get server information.  Please try again in a few minutes.');
            interaction.reply({ embeds: [fetchFailEmbed] });
            return;
        });

}