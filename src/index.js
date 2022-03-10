import Discord, { Intents, Permissions } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import dotenv from "dotenv";
dotenv.config();
import process from 'process';
import path from "path";
import { Logger } from 'log2discord';
const version = process.env.NODE_ENV;
const client = new Discord.Client({ intents: [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS] });
import fs from 'fs';
import { pool } from '../db/index.js';
import SQL_Query from '../db/query.js';
client.commands = new Discord.Collection();
import url from 'url';
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const commandFiles = fs.readdirSync(path.join(__dirname, 'lib')).filter(file => file.endsWith('.js'));
var invite;
var clientId;
const commands = [];

if (process.env.WEBHOOK) {
    var logger = new Logger({
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
        client.commands.set(command.data.name, command);
    }
})();

if (version === 'production') {
    client.login(); // Production build
    clientId = process.env.CLIENT_ID;
} else {
    client.login(process.env.NIGHTLY); // Nightly build
    clientId = process.env.DEV_CLIENT;
    var guildId = process.env.DEV_GUILD;
}

client.on("ready", () => {
    // Create database table if not exists
    let sql = " SHOW TABLES LIKE ? ";
    let vars = ['guild_data'];
    let table_exists = new SQL_Query(pool, sql, vars);
    table_exists.query()
        .then((rows) => {
            if (rows.length === 1) {
                console.log('Database table detected. Using existing table.');
            } else if (rows.length === 0) {
                createTable();
            }
        })
        .catch((err) => {
            console.log("Error while checking if table exists.");
            console.log(err);
        });

    console.log(`Logged in as ${client.user.tag}! Monitoring ${client.guilds.cache.size} servers.`);
    client.user.setPresence({ activities: [{ name: `/status | /help`, type: 'LISTENING' }] });
    client.user.setStatus("online");
    invite = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=2147502080&scope=applications.commands%20bot`;

    // Register guild commands if running dev environment
    const rest = new REST({ version: '9' }).setToken(version === 'production' ? process.env.DISCORD_TOKEN : process.env.NIGHTLY);
    (async () => {
        try {
            if (version !== "production" || version === "development") {
                await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
            }
        } catch (err) {
            console.error(err);
        }
    })();

});

client.on("guildCreate", async (guild) => {
    // When the bot joins a server
    console.log(`Joined new guild: ${guild.id} (${guild.name})`);
    addGuildToData(guild);

    if (!checkBotHasPermissions(guild)) return; // Check if bot has permissions

    try {
        // Send welcome embed message
        const welcomeEmbed = new Discord.MessageEmbed()
            .setColor('#62B36F')
            .setAuthor({ name: 'Steve', iconURL: 'https://i.imgur.com/gb5oeQt.png' })
            .setDescription(`Hello! I'm Steve, a bot designed to get and display your Minecraft server status!  Thanks for adding me to your server.  To view all my available commands, use \`/help\`.`)
            .setFooter({ text: 'Made by Alienics#5796 👾' });
        guild.systemChannel.send({ embeds: [welcomeEmbed] });
    } catch {
        // System channel not enabled
        console.log(`Server ${guild.id.toString()} (${guild.name}): System channel not enabled.  No permission to send messages.`);
    }
    return;
});

client.on("guildDelete", (guild) => {
    // When the bot is kicked or guild is deleted
    console.log(`Left guild: ${guild.id} (${guild.name})`);

    // Remove guild data from database
    let sql = "DELETE FROM guild_data WHERE guild_id = ?;";
    let vars = [guild.id];
    const remove_guild = new SQL_Query(pool, sql, vars);
    remove_guild.query();
    return;
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;
    const command = client.commands.get(interaction.commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(interaction.commandName));
    if (!command) return; // Check if command in commands folder

    // Get guild ID and check if guild in database
    let sql = ' SELECT * FROM guild_data WHERE guild_id = ? ';
    let vars = [interaction.guildId];
    let guild_exists = new SQL_Query(pool, sql, vars);
    await guild_exists.query()
        .then(async (rows) => {
            if (rows.length === 0) {
                console.log(`Server ${interaction.guildId} (${interaction.guild.name}): Guild not found in database.  Adding to database.`);
                await addGuildToData(interaction.guild);
            }
        })
        .catch((err) => {
            console.log("Error while checking if guild exists:");
            console.log(err);
        });

    // Check if author has permission to execute commands    
    if (command.permissions && !interaction.memberPermissions.has(command.permissions)) {
        const adminEmbed = new Discord.MessageEmbed()
            .setColor('#E74C3C')
            .setAuthor({ name: 'Steve', iconURL: 'https://i.imgur.com/gb5oeQt.png' })
            .setDescription(`Only administrators can make changes to Steve!`);
        return interaction.reply({ embeds: [adminEmbed] });
    }

    // Command handler
    try {
        await command.execute(pool, interaction.guildId, interaction, invite);
    } catch (error) {
        console.error(error);
        return interaction.reply({ content: 'There was an error trying to execute that command!' });
    }
});

client.on('messageCreate', async (message) => {

    // Check if message listening is still allowed
    let currentDate = Date.now();
    let expireDate = Date.UTC(2022, 4, 30);
    if (currentDate >= expireDate) return;

    // Check if message has bot prefix / mentions bot
    const prefix = '-mc ';
    let sliceLen;
    if (message.content.startsWith(prefix)) {
        sliceLen = prefix.length;
    } else if (message.mentions.has(client.user.id) && !message.mentions.everyone) {
        sliceLen = 23;
    } else {
        return;
    }

    if (message.channel.type == "dm") return; // Ignore direct messages

    if (!checkBotHasPermissions(message.guild)) return; // Check if bot has permissions

    // Separate command and arguments
    const commandBody = message.content.slice(sliceLen);
    const args = commandBody.split(' ');
    const commandName = args.shift().toLowerCase();

    // Grab commands and aliases
    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    if (!command) return; // Check if command in commands folder

    const useNewComamndsEmbed = new Discord.MessageEmbed()
        .setColor('#E74C3C')
        .setAuthor({ name: 'Steve', iconURL: 'https://i.imgur.com/gb5oeQt.png' })
        .setDescription(`Steve now uses slash commands! Use /help to learn more.`);

    return message.channel.send({ embeds: [useNewComamndsEmbed] });

});

/**
 * Create a new entry in database table with new guild information
 * @param {Discord.Guild} guild 
 * @returns Completed SQL query
 */
async function addGuildToData(guild) {
    // Create new row in guild_data table with guild ID as primary key
    let sql = "INSERT INTO guild_data VALUES (?, 1, '25565', '', '', '');";
    let vars = [guild.id];
    const add_guild = new SQL_Query(pool, sql, vars);
    return await add_guild.query()
        .catch((err) => {
            console.log(`\x1b[31m\x1b[1mError adding guild to database for guild ${guild.id} (${guild.name}):\x1b[0m`);
            console.log(err);
        });
}

/**
 * Create database table if not exists
 */
function createTable() {
    // Create new table if not already existing in database
    let sql = `CREATE TABLE IF NOT EXISTS guild_data (
        guild_id VARCHAR(18) NOT NULL,
        query BOOLEAN NOT NULL DEFAULT 1,
        port VARCHAR(5) NOT NULL DEFAULT '25565',
        url VARCHAR(2048) DEFAULT '',
        name VARCHAR(50) DEFAULT '',
        footer VARCHAR(50) DEFAULT '',
        PRIMARY KEY ( guild_id )) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`;
    let create_table = new SQL_Query(pool, sql);
    create_table.query()
        .then(console.log(`Created new table.`))
        .catch((err) => {
            console.log("Failed to create new table");
            console.log(err);
        });
}

/**
 * Check if the bot has required guild permissions
 * @param {Discord.Guild} guild 
 * @returns boolean
 */
function checkBotHasPermissions(guild) {
    // Check if bot has permissions
    if (!guild.me.permissions.has(Permissions.FLAGS.SEND_MESSAGES)) {
        console.log(`Server ${guild.id.toString()} (${guild.name}): No permission to send messages.`);
        return false;
    }
    if (!guild.me.permissions.has(Permissions.FLAGS.EMBED_LINKS)) {
        console.log(`Server ${guild.id.toString()} (${guild.name}): No permission to embed links.`);
        try {
            guild.systemChannel.send('Please enable the `Embed Links` permission for the Steve role in your Discord server settings!');
        } catch {
            console.log(`Server ${guild.id.toString()} (${guild.name}): No permission to send system channel messages.`);
        }
        return false;
    }
    return true;
}

// Refresh client presence every hour
setInterval(() => {
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

process.on('warning', (e) => {
    console.log('Warn:');
    console.warn(e.stack);
    logger ? logger.error({ message: e.message, error: e.stack }) : null;
});

process.on("unhandledRejection", (e) => {
    console.log(e);
    const message = e.message ? e.message : "Error";
    logger ? logger.error({ message: message, error: e }) : null;
});