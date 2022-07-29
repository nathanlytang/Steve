import Discord, { Intents, Permissions } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import dotenv from "dotenv";
dotenv.config();
import process, { exit } from 'process';
import path from "path";
//@ts-ignore
import { Logger } from 'log2discord';
const version = process.env.NODE_ENV;
const client: Discord.Client = new Discord.Client({ intents: [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS] });
import fs from 'fs';
import { pool } from '../db/index.js';
import query from '../db/query.js';
const commandCollection = new Discord.Collection();
import url from 'url';
import { Command } from '../types';
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const commandFiles = fs.readdirSync(path.join(__dirname, 'lib')).filter(file => file.endsWith('.js'));
let invite: string;
let clientId: string;
let guildId: string;
let logger: Logger;
const commands: Command[] = [];

if (process.env.WEBHOOK) {
    logger = new Logger({
        webhook: process.env.WEBHOOK,
        icon: "https://i.imgur.com/gb5oeQt.png",
        name: "Steve (Logs)",
        pid: true,
        host: true,
        dateTime: {
            timeZone: process.env.TIMEZONE || "UTC",
            locale: process.env.LOCALE || "default"
        }
    });
}

// Put commands in collection
(async () => {
    for (const file of commandFiles) {
        const command = await import(`./lib/${file}`);
        commands.push(command.data.toJSON());
        commandCollection.set(command.data.name, command);
    }
})();

if (version === 'production') {
    client.login(); // Production build
    clientId = process.env.CLIENT_ID || "";
} else {
    client.login(process.env.NIGHTLY); // Nightly build
    clientId = process.env.DEV_CLIENT || "";
    guildId = process.env.DEV_GUILD || "";
}

client.on("ready", async () => {

    if (!client.user) exit();

    // Create database table if not exists
    try {
        const sql = " SHOW TABLES LIKE ? ";
        const vars = ['guild_data'];
        const rows = await query(pool, sql, vars);
        if (rows.length === 1) {
            console.log('Database table detected. Using existing table.');
        } else if (rows.length === 0) {
            createTable();
        }
    } catch (err) {
        console.log("Error while checking if table exists.");
        console.log(err);
    }

    console.log(`Logged in as ${client.user.tag}! Monitoring ${client.guilds.cache.size} servers.`);
    client.user.setPresence({ activities: [{ name: `/status | /help`, type: 'LISTENING' }] });
    client.user.setStatus("online");
    invite = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=2147502080&scope=applications.commands%20bot`;

    // Register guild commands if running dev environment
    const rest = new REST({ version: '9' }).setToken(version === 'production' ? process.env.DISCORD_TOKEN || "" : process.env.NIGHTLY || "");
    try {
        if (version !== "production") {
            await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
        }
    } catch (err) {
        console.error(err);
    }

});

client.on("guildCreate", async (guild) => {
    // When the bot joins a server
    console.log(`Joined new guild: ${guild.id} (${guild.name})`);
    addGuildToData(guild);

    if (!checkBotHasPermissions(guild)) return; // Check if bot has permissions

    // Send welcome embed message
    const welcomeEmbed = new Discord.MessageEmbed()
        .setColor('#62B36F')
        .setAuthor({ name: 'Steve', iconURL: 'https://i.imgur.com/gb5oeQt.png' })
        .setDescription(`Hello! I'm Steve, a bot designed to get and display your Minecraft server status!  Thanks for adding me to your server.  To view all my available commands, use \`/help\`.`)
        .setFooter({ text: 'Made by Alienics#5796 👾' });
    if (guild.systemChannel) {
        guild.systemChannel.send({ embeds: [welcomeEmbed] });
    } else {
        console.log(`Server ${guild.id.toString()} (${guild.name}): System channel not enabled.  No permission to send messages.`);
    }
    return;
});

client.on("guildDelete", async (guild) => {
    // When the bot is kicked or guild is deleted
    console.log(`Left guild: ${guild.id} (${guild.name})`);

    // Remove guild data from database
    const sql = "DELETE FROM guild_data WHERE guild_id = ?;";
    const vars = [guild.id];
    await query(pool, sql, vars);
    return;
});

client.on('interactionCreate', async (interaction: Discord.Interaction) => {
    if (!interaction.isCommand() || !interaction.guildId) return;
    const command = commandCollection.get(interaction.commandName) as Command;
    if (!command) return; // Check if command in commands folder

    try {
        const sql = ' SELECT * FROM guild_data WHERE guild_id = ? ';
        const vars = [interaction.guildId ? interaction.guildId : ""];
        const rows = await query(pool, sql, vars);
        if (rows.length === 0 && interaction.guild) {
            console.log(`Server ${interaction.guildId} (${interaction.guild?.name}): Guild not found in database.  Adding to database.`);
            await addGuildToData(interaction.guild);
        }
    } catch (err) {
        // Get guild ID and check if guild in database
        console.log("Error while checking if guild exists:");
        console.log(err);
    }


    // Check if author has permission to execute commands    
    if (command.permissions && !interaction.memberPermissions?.has(command.permissions)) {
        const adminEmbed = new Discord.MessageEmbed()
            .setColor('#E74C3C')
            .setAuthor({ name: 'Steve', iconURL: 'https://i.imgur.com/gb5oeQt.png' })
            .setDescription(`Only administrators can make changes to Steve!`);
        return interaction.reply({ embeds: [adminEmbed] });
    }

    // Command handler
    try {
        const options = { pool: pool, serverID: interaction.guildId, interaction: interaction, invite: invite };
        command.execute(options);
    } catch (error) {
        console.error(error);
        return interaction.reply({ content: 'There was an error trying to execute that command!' });
    }
});

/**
 * Create a new entry in database table with new guild information
 * @param {Discord.Guild} guild 
 * @returns Completed SQL query
 */
async function addGuildToData(guild: Discord.Guild) {
    // Create new row in guild_data table with guild ID as primary key
    const sql = "INSERT INTO guild_data VALUES (?, 1, '25565', '', '', '');";
    const vars = [guild.id];
    const add_guild = await query(pool, sql, vars);
    return await add_guild.query()
        .catch((err: Error) => {
            console.log(`\x1b[31m\x1b[1mError adding guild to database for guild ${guild.id} (${guild.name}):\x1b[0m`);
            console.log(err);
        });
}

/**
 * Create database table if not exists
 */
async function createTable() {
    try {
        // Create new table if not already existing in database
        const sql = `CREATE TABLE IF NOT EXISTS guild_data (
            guild_id VARCHAR(255) NOT NULL,
            query BOOLEAN NOT NULL DEFAULT 1,
            port VARCHAR(5) NOT NULL DEFAULT '25565',
            url VARCHAR(2048) DEFAULT '',
            name VARCHAR(50) DEFAULT '',
            footer VARCHAR(50) DEFAULT '',
            PRIMARY KEY ( guild_id )) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`;
        await query(pool, sql, []);
        console.log(`Created new table.`);
    } catch (err) {
        console.log("Failed to create new table");
        console.log(err);
    }
}

/**
 * Check if the bot has required guild permissions
 * @param {Discord.Guild} guild 
 * @returns boolean
 */
function checkBotHasPermissions(guild: Discord.Guild): boolean {
    // Check if bot has permissions
    if (!guild.me?.permissions.has(Permissions.FLAGS.SEND_MESSAGES)) {
        console.log(`Server ${guild.id.toString()} (${guild.name}): No permission to send messages.`);
        return false;
    }
    if (!guild.me.permissions.has(Permissions.FLAGS.EMBED_LINKS)) {
        console.log(`Server ${guild.id.toString()} (${guild.name}): No permission to embed links.`);
        if (guild.systemChannel) {
            guild.systemChannel.send('Please enable the `Embed Links` permission for the Steve role in your Discord server settings!');
        } else {
            console.log(`Server ${guild.id.toString()} (${guild.name}): No permission to send system channel messages.`);
        }
        return false;
    }
    return true;
}

// Refresh client presence every hour
setInterval(() => {
    if (!client.user) exit();
    client.user.setPresence({ activities: [{ name: `/status | /help`, type: 'LISTENING' }] });
    client.user.setStatus("online");
}, 3600000);

// Node.js signal event listeners
process.on('SIGTERM', () => { // Kill process
    console.log('SIGTERM signal received.');
    process.exit(0);
});

process.on('SIGINT', () => { // Ctrl+C
    console.log('SIGINT signal recieved.');
    process.exit(0);
});

process.on('warning', (e: Error) => {
    console.log('Warn:');
    console.warn(e.stack);
    logger ? logger.error({ message: e.message, error: e }) : null;
});

process.on("unhandledRejection", (e: Error) => {
    console.log(e);
    const message = e.message ? e.message : "Error";
    logger ? logger.error({ message: message, error: e }) : null;
});