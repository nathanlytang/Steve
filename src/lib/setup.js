import { SlashCommandBuilder } from "@discordjs/builders";
import SQL_Query from '../../db/query.js';

export const name = 'setup';
export const permissions = 'ADMINISTRATOR';
export const description = 'Get server setup';
export const data = new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Get setup information for Steve');
export async function execute(Discord, pool, serverID, message, args, invite, prefix) {
    console.log(`Server ${serverID} (${message.guild.name}) sent setup command`);

    if (args.length == 0) { // Display setup instructions
        const setupEmbed = new Discord.MessageEmbed()
            .setColor('#62B36F')
            .setAuthor('Steve Setup Instructions', 'https://i.imgur.com/gb5oeQt.png')
            .setDescription(`Follow these commands to set Steve up for your server!`)
            .addField('Vanilla', '- In your `server.properties` file, set `enable-query` to `true`.\n- In `server.properties`, ensure `query.port` is the same as `server.port`.\n- Ensure the query port is port forwarded if not using server port.\n- Save and restart the server.')
            .addField('Bungeecord', '- In `config.yml`, set `query_enabled` to `true`.\n- In `config.yml`, ensure `query_port` is the same as server port (`host` port)\n- Ensure the query port is port forwarded if not using server port.\n- Save and restart the proxy.')
            .addFields(
                { name: 'Commands', value: `${prefix}setup ip <Server IP>\n${prefix}setup port <Query Port>\n${prefix}setup name <Server name>\n${prefix}setup footer <Footer message>\n`, inline: true },
                { name: 'Description', value: 'Set the server IP (IP or URL accepted)\nSet the server port (Default 25565)\nSet your server name\nSet a footer message\n', inline: true },
                { name: 'Unable to use Query', value: `If you cannot enable query on your server, run \`${prefix}setup query <enable|disable>\` to enable or disable querying.  When query is disabled, Steve will instead use server pinging.  Note that this may break some functionality (Player list will not be shown on Bungeecord servers).` },
                { name: 'Note', value: 'Remove the `<` and the `>` when using the setup commands.' }
            );
        return message.channel.send({ embeds: [setupEmbed] });
    }

    // Remove comparison symbols on single argument setups
    if (args[1] && (args[0] === 'query' || args[0] === 'ip' || args[0] === 'port')) {
        if (args[1].startsWith('<')) {
            args[1] = args[1].substring(1);
        }
        if (args[1].endsWith('>')) {
            args[1] = args[1].slice(0, -1);
        }
    }

    if (args[0] === 'query') { // Enable or disable query

        if (args.length == 1) { // Check if not enough arguments
            const noArgEmbed = new Discord.MessageEmbed()
                .setColor('#E74C3C')
                .setTitle(`Query enable or disable not specified`)
                .setDescription(`Please set \`enable\` or \`disable\`!  No changes have been made.`);
            return message.channel.send({ embeds: [noArgEmbed] });
        } else if (args.length > 2) { // Check if too many arguments
            const noArgEmbed = new Discord.MessageEmbed()
                .setColor('#E74C3C')
                .setTitle(`Too Many Arguments`)
                .setDescription(`Please input only \`enable\` or \`disable\`!  No changes have been made.`);
            return message.channel.send({ embeds: [noArgEmbed] });
        }

        try {
            if (args[1] === 'enable') { // Use query instead of ping
                let sql = "UPDATE guild_data SET query = ? WHERE guild_id = ?;";
                let vars = [1, serverID];
                let setup_query = new SQL_Query(pool, sql, vars);
                setup_query.query()
                    .then(() => {
                        console.log(`Successfully enabled query for server ${serverID} (${message.guild.name})`);
                        return message.channel.send({ content: `Server querying enabled!  Query will be used instead of ping.` });
                    })
                    .catch(() => {
                        console.log(`\x1b[31m\x1b[1mError setting query to ${args[1]} for server ${serverID} (${message.guild.name}):\x1b[0m`);
                        return message.channel.send({ content: `Error changing query!  Ensure you are using \`-mc setup query enable\` or \`-mc setup query disable\`.` });
                    });

            } else if (args[1] === 'disable') { // Use ping instead of query
                let sql = "UPDATE guild_data SET query = ? WHERE guild_id = ?;";
                let vars = [0, serverID];
                let setup_query = new SQL_Query(pool, sql, vars);
                setup_query.query()
                    .then(() => {
                        console.log(`Successfully disabled query for server ${serverID} (${message.guild.name})`);
                        return message.channel.send({ content: `Server querying disabled!  Server pinging will be used instead.` });
                    })
                    .catch(() => {
                        console.log(`\x1b[31m\x1b[1mError setting query to ${args[1]} for server ${serverID} (${message.guild.name}):\x1b[0m`);
                        return message.channel.send({ content: `Error changing query!  Ensure you are using \`-mc setup query enable\` or \`-mc setup query disable\`.` });
                    });

            } else {
                console.log(`\x1b[31m\x1b[1mError setting query to ${args[1]} for server ${serverID} (${message.guild.name}):\x1b[0m`);
                return message.channel.send({ content: `Error changing query!  Ensure you are using \`-mc setup query enable\` or \`-mc setup query disable\`.` });
            }
        }
        catch (err) {
            console.log(`\x1b[31m\x1b[1mError setting query to ${args[1]} for server ${serverID} (${message.guild.name}):\x1b[0m`);
            console.log(err);
            return message.channel.send({ content: `Error changing query!  Ensure you are using \`-mc setup query enable\` or \`-mc setup query disable\`.` });
        }
    }

    if (args[0] === 'ip') { // Setup IP address / URL

        if (args[1] == undefined) { // Check if not enough arguments
            const noArgEmbed = new Discord.MessageEmbed()
                .setColor('#E74C3C')
                .setTitle(`No IP Specified`)
                .setDescription(`No IP was specified!  No changes have been made.`);
            return message.channel.send({ embeds: [noArgEmbed] });
        } else if (args.length > 2) { // Check if too many arguments
            const tooManyArgEmbed = new Discord.MessageEmbed()
                .setColor('#E74C3C')
                .setTitle(`Too Many Arguments`)
                .setDescription(`Too many arguments!  Please enter only one IP Address or URL.  No changes have been made.`);
            return message.channel.send({ embeds: [tooManyArgEmbed] });
        }

        const privateIPEmbed = new Discord.MessageEmbed()
            .setColor('#E74C3C')
            .setTitle('Invalid IP Address')
            .setDescription(`The IP address entered is a private IP address! This means that I cannot reach your server. 
                    To continue, please port forward your server query port, and use your public IP address instead.  No changes to your settings have been made.`);
        // Check if private IP address
        if (args[1].startsWith("192.168.") || args[1].startsWith("10.")) {
            console.log(`\x1b[31m\x1b[1mError setting IP for server ${serverID} (${message.guild.name}):  Private IP address\x1b[0m`);
            return message.channel.send({ embeds: [privateIPEmbed] });
        }
        if (args[1].startsWith("172.")) {
            for (let i = 16; i <= 31; i++) {
                if (args[1].startsWith(`172.${i}`)) {
                    console.log(`\x1b[31m\x1b[1mError setting IP for server ${serverID} (${message.guild.name}):  Private IP address\x1b[0m`);
                    return message.channel.send({ embeds: [privateIPEmbed] });
                }
            }
        }

        try {
            // Update URL in database
            let sql = "UPDATE guild_data SET url = ? WHERE guild_id = ?;";
            let vars = [args[1], serverID];
            let setup_query = new SQL_Query(pool, sql, vars);
            setup_query.query()
                .then(() => {
                    console.log(`Successfully set up IP for server ${serverID} (${message.guild.name})`);
                    return message.channel.send({ content: `Server IP of \`${args[1]}\` successfully set!` });
                })
                .catch((err) => {
                    console.log(`\x1b[31m\x1b[1mError setting IP for server ${serverID} (${message.guild.name}):\x1b[0m`);
                    console.log(err);
                    return message.channel.send({ content: `Error setting IP!` });
                });
        }
        catch (err) {
            console.log(`\x1b[31m\x1b[1mError setting IP for server ${serverID} (${message.guild.name}):\x1b[0m`);
            console.log(err);
            return message.channel.send({ content: `Error setting IP!` });
        }
    }

    if (args[0] === 'port') { // Setup server port

        if (args[1] == undefined) { // Check if not enough arguments
            const noArgEmbed = new Discord.MessageEmbed()
                .setColor('#E74C3C')
                .setTitle(`No Port Specified`)
                .setDescription(`No port was specified!  No changes have been made.`);
            return message.channel.send({ embeds: [noArgEmbed] });
        } else if (args.length > 2) { // Check if too many arguments
            const tooManyArgEmbed = new Discord.MessageEmbed()
                .setColor('#E74C3C')
                .setTitle(`Too Many Arguments`)
                .setDescription(`Too many arguments!  Please enter only one server port.  No changes have been made.`);
            return message.channel.send({ embeds: [tooManyArgEmbed] });
        }

        try {
            let port = Number(args[1]);
            if (!Number.isInteger(port) || port < 1 || port > 65535) { // Ensure valid port
                const badPortEmbed = new Discord.MessageEmbed()
                    .setColor('#E74C3C')
                    .setTitle(`Port Not Allowed`)
                    .setDescription(`Please ensure your port is a number between 1 and 65535!  No changes have been made.`);
                return message.channel.send({ embeds: [badPortEmbed] });
            }

            // Update port in database
            let sql = "UPDATE guild_data SET port = ? WHERE guild_id = ?;";
            let vars = [args[1], serverID];
            let setup_query = new SQL_Query(pool, sql, vars);
            setup_query.query()
                .then(() => {
                    console.log(`Successfully set up port for server ${serverID} (${message.guild.name})`);
                    return message.channel.send({ content: `Server port of \`${args[1]}\` successfully set!` });
                })
                .catch((err) => {
                    console.log(`\x1b[31m\x1b[1mError setting port for server ${serverID} (${message.guild.name}):\x1b[0m`);
                    console.log(err);
                    return message.channel.send({ content: `Error setting port!` });
                });
        }
        catch (err) {
            console.log(`\x1b[31m\x1b[1mError setting port for server ${serverID} (${message.guild.name}):\x1b[0m`);
            console.log(err);
            return message.channel.send({ content: `Error setting port!` });
        }
    }

    if (args[0] === 'name') { // Setup server name

        if (args[1] == undefined) { // Check if argument included
            const noArgEmbed = new Discord.MessageEmbed()
                .setColor('#E74C3C')
                .setTitle(`No Name Specified`)
                .setDescription(`No name was specified!  No changes have been made.`);
            return message.channel.send({ embeds: [noArgEmbed] });
        }

        try {
            // Get server name from arguments
            var name = ``;
            for (let i = 1; i < args.length; i++) {
                name += `${args[i]} `;
            }
            name = name.substring(0, name.length - 1);

            // Update name in database
            let sql = "UPDATE guild_data SET name = ? WHERE guild_id = ?;";
            let vars = [name, serverID];
            let setup_query = new SQL_Query(pool, sql, vars);
            setup_query.query()
                .then(() => {
                    console.log(`Successfully set up name for server ${serverID} (${message.guild.name})`);
                    return message.channel.send({ content: `Server name of \`${name}\` successfully set!` });
                })
                .catch((err) => {
                    console.log(`\x1b[31m\x1b[1mError setting name for server ${serverID} (${message.guild.name}):\x1b[0m`);
                    console.log(err);
                    return message.channel.send({ content: `Error setting name!` });
                });
        }
        catch (err) {
            console.log(`\x1b[31m\x1b[1mError setting name for server ${serverID} (${message.guild.name}):\x1b[0m`);
            console.log(err);
            return message.channel.send({ content: `Error setting name!` });
        }
    }

    if (args[0] === 'footer') { // Setup footer

        if (args[1] == undefined) { // Check if argument included
            const noArgEmbed = new Discord.MessageEmbed()
                .setColor('#E74C3C')
                .setTitle(`No Footer Specified`)
                .setDescription(`No footer was specified!  No changes have been made.`);
            return message.channel.send({ embeds: [noArgEmbed] });
        }

        try {
            // Get footer message from arguments
            var footerMessage = ``;
            for (let i = 1; i < args.length; i++) {
                footerMessage += `${args[i]} `;
            }
            footerMessage = footerMessage.substring(0, footerMessage.length - 1);

            // Delete footer message 
            if (footerMessage === "remove" || footerMessage === "delete") {
                footerMessage = ``;
            }

            // Update footer message in database
            let sql = "UPDATE guild_data SET footer = ? WHERE guild_id = ?;";
            let vars = [footerMessage, serverID];
            let setup_query = new SQL_Query(pool, sql, vars);
            setup_query.query()
                .then(() => {
                    console.log(`Successfully set up footer for server ${serverID} (${message.guild.name})`);
                    if (footerMessage.length === 0) {
                        return message.channel.send({ content: `Server footer successfully removed!` });
                    }
                    return message.channel.send({ content: `Server footer of \`${footerMessage}\` successfully set!` });
                })
                .catch((err) => {
                    console.log(`\x1b[31m\x1b[1mError setting footer for server ${serverID} (${message.guild.name}):\x1b[0m`);
                    console.log(err);
                    return message.channel.send({ content: `Error setting footer!` });
                });

        }
        catch (err) {
            console.log(`\x1b[31m\x1b[1mError setting footer for server ${serverID} (${message.guild.name}):\x1b[0m`);
            console.log(err);
            return message.channel.send({ content: `Error setting footer!` });
        }
    }
}