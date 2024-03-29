import Discord, { PermissionFlagsBits } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import path from "path";
import url from 'url';
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
//@ts-ignore
import Query from 'mcquery/lib/index.js';
//@ts-ignore
import mcping from 'mcping-js';
import query from '../../db/query.js';
import { CommandOptions } from '../../types';

export const name = 'status';
export const description = 'Get server status';
export const data = new SlashCommandBuilder()
    .setName('status')
    .setDescription('Get current Minecraft server status')
    .setDefaultMemberPermissions(PermissionFlagsBits.UseApplicationCommands)

export async function execute(options: CommandOptions) {
    const { pool, serverID, interaction } = options;
    const defaultFavicon = "../../assets/favicon.png";

    // Functions
    function statusCheckFail(err: Error | unknown) {
        console.error(`Failed to fetch server info: ${err}`);
        const fetchFailEmbed = new Discord.EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('Failed to get server information')
            .setDescription('Failed to get server information.  Please try again in a few minutes.');
        interaction.editReply({ embeds: [fetchFailEmbed] });
        return;
    }

    function offlineEmbed() {
        // Create and send server offline embed
        const statusEmbed = new Discord.EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('Server Status')
            .addFields(
                { name: 'Status', value: `Offline\n`, inline: true },
                { name: 'Version', value: `Unknown\n`, inline: true }
            )
            .addFields(
                { name: 'Players', value: `None\n`, inline: true }
            );
        interaction.editReply({ embeds: [statusEmbed] });
        return;
    }

    // Start of command
    console.log(`Server ${serverID} (${interaction.guild?.name}) sent status command`);

    await interaction.deferReply();

    const sql = "SELECT url, port, query, footer FROM guild_data WHERE guild_id = ?";
    const vars = [serverID];
    const rows = await query(pool, sql, vars);
    try {
        if (rows[0].url == "") { // Check if URL set up
            return interaction.editReply({ content: `Your server IP has not been set up!  Please use \`/setup\` to get the setup information.` });
        }

        if (rows[0].query === 1) { // Grab server information using query if querying enabled
            // Create a new query using the server IP/port
            const query = new Query(rows[0].url, rows[0].port);

            // Sends a query request to the server IP/port
            query.connect()
                .then(() => {
                    query.full_stat((err: Error, stat: any) => {
                        if (err) {
                            statusCheckFail(err);
                        }

                        try {
                            // Send a ping request to the server IP/port to grab server icon
                            const ping = new mcping.MinecraftServer(rows[0].url, rows[0].port);
                            ping.ping(4000, -1, (pingErr: Error, res: any) => {

                                // Convert base64 favion to buffer and include as attachment if server icon exists
                                let imgAttach;
                                if (pingErr || !res.favicon) {
                                    imgAttach = path.join(__dirname, defaultFavicon);
                                } else {
                                    const image = Buffer.from(res.favicon.split(",")[1], 'base64');
                                    imgAttach = new Discord.AttachmentBuilder(image, { name: "favicon.png" });
                                }

                                // Get player list
                                let playerList;
                                try {
                                    playerList = 'No current players';
                                    if (stat.numplayers > 0 && stat.numplayers <= 20) {
                                        playerList = ``;
                                        for (let i = 0; i < stat.numplayers; i++) {
                                            if (i % 4 == 0) {
                                                playerList += `\n`;
                                            }
                                            playerList += `${stat.player_[i]}, `;
                                        }
                                        playerList = playerList.substring(0, playerList.length - 2);
                                    } else if (stat.numplayers > 20) {
                                        playerList = 'Too many to show!';
                                    }
                                } catch {
                                    console.log(`Server ${serverID} (${interaction.guild?.name}): Player number does not match list`);
                                    playerList = 'Unknown';
                                }

                                // Create and send server online embed
                                const statusEmbed = new Discord.EmbedBuilder()
                                    .setColor('#2ECC71')
                                    .setTitle('Minecraft Server Status')
                                    .addFields(
                                        { name: 'Status', value: `Online\n`, inline: true },
                                        { name: 'Version', value: `${stat.version}\n`, inline: true }
                                    )
                                    .setThumbnail('attachment://favicon.png')
                                    .addFields(
                                        { name: 'Players', value: `${stat.numplayers}/${stat.maxplayers}\n`, inline: true },
                                        { name: 'List', value: `${playerList}\n`, inline: true }
                                    )
                                if (rows[0].footer.length > 0) {
                                    statusEmbed.setFooter({ text: `${rows[0].footer}` });
                                }
                                interaction.editReply({ embeds: [statusEmbed], files: [imgAttach] });
                            });

                        } catch (err) {
                            statusCheckFail(err);
                        }
                        // Close query request when complete
                        if (query.outstandingRequests === 0) {
                            query.close();
                        }
                    });
                    return;
                })
                .catch(() => {
                    // Create and send server offline embed
                    offlineEmbed();
                    return;
                });
        } else { // Grab server information using ping if querying disabled
            try {
                // Send a ping request to the server IP/port to grab server icon
                const ping = new mcping.MinecraftServer(rows[0].url, rows[0].port);
                ping.ping(4000, -1, (pingErr: Error, res: any) => {

                    // Send offline embed if ping error
                    if (pingErr) {
                        // Create and send server offline embed
                        offlineEmbed();
                        return;
                    }

                    // Convert base64 favion to buffer and include as attachment if server icon exists
                    let imgAttach;
                    if (!res.favicon) {
                        imgAttach = path.join(__dirname, defaultFavicon);
                    } else {
                        const image = Buffer.from(res.favicon.split(",")[1], 'base64');
                        imgAttach = new Discord.AttachmentBuilder(image, { name: "favicon.png" });
                    }

                    // Get player list
                    let playerList;
                    try {
                        playerList = 'No current players';
                        if (res.players.online > 20) {
                            playerList = 'Too many to show!';
                        } else if (res.players.online > 0 && res.players.online <= 20) {
                            playerList = ``;
                            for (let i = 0; i < res.players.online; i++) {
                                if (i % 4 == 0) {
                                    playerList += `\n`;
                                }
                                playerList += `${res.players.sample[i].name}, `;
                            }
                            playerList = playerList.substring(0, playerList.length - 2);
                        }
                    } catch {
                        console.log(`Server ${serverID} (${interaction.guild?.name}): Player number does not match list`);
                        playerList = 'Unknown';
                    }

                    // Create and send server online embed
                    const statusEmbed = new Discord.EmbedBuilder()
                        .setColor('#2ECC71')
                        .setTitle('Minecraft Server Status')
                        .addFields(
                            { name: 'Status', value: `Online\n`, inline: true },
                            { name: 'Version', value: `${res.version.name}\n`, inline: true }
                        )
                        .setThumbnail('attachment://favicon.png')
                        .addFields(
                            { name: 'Players', value: `${res.players.online}/${res.players.max}\n`, inline: true },
                            { name: 'List', value: `${playerList}\n`, inline: true }
                        )
                    if (rows[0].footer.length > 0) {
                        statusEmbed.setFooter({ text: `${rows[0].footer}` });
                    }
                    interaction.editReply({ embeds: [statusEmbed], files: [imgAttach] });
                    return;
                });

            } catch (err) {
                statusCheckFail(err);
            }
        }
    } catch (err) {
        console.log(`Database error:`);
        statusCheckFail(err);
        return;
    }
}