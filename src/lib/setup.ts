import Discord from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { Permissions } from 'discord.js';
import query from '../../db/query.js';
import { CommandOptions } from '../../types';

export const name = 'setup';
export const permissions = new Permissions([Permissions.FLAGS.ADMINISTRATOR]);
export const description = 'Get server setup';
export const data = new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Get setup information for Steve')
    .setDefaultPermission(true)
    .addStringOption(option =>
        option.setName('ip')
            .setDescription('Minecraft server IP address'))
    .addIntegerOption(option =>
        option.setName('port')
            .setDescription('Minecraft server port number'))
    .addStringOption(option =>
        option.setName('name')
            .setDescription('Minecraft server name'))
    .addStringOption(option =>
        option.setName('footer')
            .setDescription('Minecraft server footer'))
    .addBooleanOption(option =>
        option.setName('query')
            .setDescription('Enable or disable query'));

export async function execute(options: CommandOptions) {
    const { pool, serverID, interaction } = options;
    // Functions
    function replyError(arg: string, err: Error | unknown) {
        console.error(`\x1b[31m\x1b[1mError setting ${arg} for server ${serverID} (${interaction.guild?.name}):\x1b[0m`);
        console.error(err);
        settingsModifiedEmbed.addFields({ name: `⛔ ${arg.charAt(0).toUpperCase() + arg.slice(1)}`, value: `There was an error setting ${arg}!` });
    }

    // Start of command
    console.log(`Server ${serverID} (${interaction.guild?.name}) sent setup command`);

    await interaction.deferReply();
    const settingsModifiedEmbed = new Discord.MessageEmbed()
        .setColor('#2ECC71')
        .setAuthor({ name: 'Steve Setup', iconURL: 'https://i.imgur.com/gb5oeQt.png' })
        .setDescription(`The following settings have been modified:`);

    const embeds = [settingsModifiedEmbed];
    const args = {
        ip: interaction.options.getString('ip'),
        port: interaction.options.getInteger('port'),
        name: interaction.options.getString('name'),
        footer: interaction.options.getString('footer'),
        query: interaction.options.getBoolean('query')
    };

    if (Object.values(args).filter(p => p === null).length === 0) { // Display setup instructions
        const setupEmbed = new Discord.MessageEmbed()
            .setColor('#62B36F')
            .setAuthor({ name: 'Steve Setup Instructions', iconURL: 'https://i.imgur.com/gb5oeQt.png' })
            .setDescription(`Follow these commands to set Steve up for your server!`)
            .addFields({ name: 'Vanilla', value: '- In your `server.properties` file, set `enable-query` to `true`.\n- In `server.properties`, ensure `query.port` is the same as `server.port`.\n- Ensure the query port is port forwarded if not using server port.\n- Save and restart the server.' })
            .addFields({ name: 'Bungeecord', value: '- In `config.yml`, set `query_enabled` to `true`.\n- In `config.yml`, ensure `query_port` is the same as server port (`host` port)\n- Ensure the query port is port forwarded if not using server port.\n- Save and restart the proxy.' })
            .addFields(
                { name: 'Commands', value: `/setup ip <Server IP>\n/setup port <Query Port>\n/setup name <Server name>\n/setup footer <Footer message>\n`, inline: true },
                { name: 'Description', value: 'Set the server IP (IP or URL accepted)\nSet the server port (Default 25565)\nSet your server name\nSet a footer message\n', inline: true },
                { name: 'Unable to use Query', value: `If you cannot enable query on your server, run \`/setup query <True|False>\` to enable or disable querying.  When query is disabled, Steve will instead use server pinging.  Note that this may break some functionality (Player list will not be shown on Bungeecord servers).` },
                { name: 'Note', value: 'Remove the `<` and the `>` when using the setup commands.' }
            );
        return interaction.editReply({ embeds: [setupEmbed] });
    }

    if (args.query !== null) { // Enable or disable query
        try {
            if (args.query) { // Use query instead of ping
                try {
                    const sql = "UPDATE guild_data SET query = ? WHERE guild_id = ?;";
                    const vars = [1, serverID];
                    await query(pool, sql, vars);
                    console.log(`Successfully enabled query for server ${serverID} (${interaction.guild?.name})`);
                    settingsModifiedEmbed.addFields({ name: 'Query', value: 'Server querying enabled!  Server querying will be used instead of ping.' });
                } catch (err) {
                    replyError("query", err);
                };

            } else { // Use ping instead of query
                try {
                    const sql = "UPDATE guild_data SET query = ? WHERE guild_id = ?;";
                    const vars = [0, serverID];
                    await query(pool, sql, vars);
                    console.log(`Successfully disabled query for server ${serverID} (${interaction.guild?.name})`);
                    settingsModifiedEmbed.addFields({ name: 'Query', value: 'Server querying disabled!  Server pinging will be used instead.' });
                } catch (err) {
                    replyError("query", err);
                }
            }
        }
        catch (err) {
            replyError("query", err);
        }
    }

    if (args.ip) { // Setup IP address / URL
        // Check for and remove comparison symbols
        if (args.ip.startsWith('<')) {
            args.ip = args.ip.substring(1);
        }
        if (args.ip.endsWith('>')) {
            args.ip = args.ip.slice(0, -1);
        }

        // Check if private IP address
        if (/^(10)\.(.*)\.(.*)\.(.*)$/.test(args.ip) || /^(172)\.(1[6-9]|2[0-9]|3[0-1])\.(.*)\.(.*)$/.test(args.ip) || /^(192)\.(168)\.(.*)\.(.*)$/.test(args.ip)) {
            console.log(`\x1b[31m\x1b[1mError setting IP for server ${serverID} (${interaction.guild?.name}):  Private IP address\x1b[0m`);
            const privateIPEmbed = new Discord.MessageEmbed()
                .setTitle('Invalid IP Address')
                .setColor('#E74C3C')
                .setDescription(`The IP address entered is a private IP address! This means that I cannot reach your server.
                                    To continue, please port forward your server query port, and use your public IP address instead.  No changes to the IP address have been made.`);
            embeds.push(privateIPEmbed);
        } else {
            try {
                // Update URL in database
                const sql = "UPDATE guild_data SET url = ? WHERE guild_id = ?;";
                const vars = [args.ip, serverID];
                const setup_query = await query(pool, sql, vars);
                await setup_query.query()
                console.log(`Successfully set up IP for server ${serverID} (${interaction.guild?.name})`);
                settingsModifiedEmbed.addFields({ name: 'IP address', value: `Server IP set to \`${args.ip}\`` });
            }
            catch (err) {
                replyError("IP address", err);
            }
        }
    }

    if (args.port) { // Setup server port
        try {
            if (args.port < 1 || args.port > 65535) { // Ensure valid port
                const badPortEmbed = new Discord.MessageEmbed()
                    .setColor('#E74C3C')
                    .setTitle(`Port Not Allowed`)
                    .setDescription(`Please ensure your port is a number between 1 and 65535!  No changes have been made.`);
                embeds.push(badPortEmbed);
            } else {
                try {
                    // Update port in database
                    const sql = "UPDATE guild_data SET port = ? WHERE guild_id = ?;";
                    const vars = [args.port, serverID];
                    const setup_query = await query(pool, sql, vars);
                    await setup_query.query()
                    console.log(`Successfully set up port for server ${serverID} (${interaction.guild?.name})`);
                    settingsModifiedEmbed.addFields({ name: 'Port', value: `Server port set to \`${args.port}\`` });
                } catch (err) {
                    replyError("port", err);
                }
            }
        }
        catch (err) {
            replyError("port", err);
        }
    }

    if (args.name) { // Setup server name
        try {
            // Update name in database
            const sql = "UPDATE guild_data SET name = ? WHERE guild_id = ?;";
            const vars = [args.name, serverID];
            const setup_query = await query(pool, sql, vars);
            await setup_query.query()
            console.log(`Successfully set up name for server ${serverID} (${interaction.guild?.name})`);
            settingsModifiedEmbed.addFields({ name: 'Name', value: `Server name set to \`${args.name}\`` });
        }
        catch (err) {
            replyError("name", err);
        }
    }

    if (args.footer) { // Setup footer
        try {
            if (args.footer.length > 50) {
                const longFooterEmbed = new Discord.MessageEmbed()
                    .setTitle('Footer too long')
                    .setColor('#E74C3C')
                    .setDescription(`The maximum footer length is 50 characters.  No changes to the footer have been made.`);
                embeds.push(longFooterEmbed);
            } else {
                // Delete footer message
                if (args.footer === "remove" || args.footer === "delete") {
                    args.footer = ``;
                }
                try {
                    // Update footer message in database
                    const sql = "UPDATE guild_data SET footer = ? WHERE guild_id = ?;";
                    const vars = [args.footer, serverID];
                    const setup_query = await query(pool, sql, vars);
                    await setup_query.query()

                    console.log(`Successfully set up footer for server ${serverID} (${interaction.guild?.name})`);
                    if (args.footer.length === 0) {
                        settingsModifiedEmbed.addFields({ name: 'Footer', value: 'Server footer successfully removed!' });
                    } else {
                        settingsModifiedEmbed.addFields({ name: 'Footer', value: `Server footer set to \`${args.footer}\`` });
                    }
                } catch (err) {
                    replyError("footer", err);
                }
            }
        }
        catch (err) {
            replyError("footer", err);
        }
    }

    // If no settings are changed, do not show settings modified embed
    if (settingsModifiedEmbed.fields.length === 0) {
        embeds.shift();
    }

    return interaction.editReply({ embeds: embeds });
}