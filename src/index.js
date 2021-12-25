import Discord, { Intents, Permissions } from 'discord.js';
import dotenv from "dotenv";
dotenv.config();
import process from 'process';
import path from "path";
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
const prefix = '-mct ';
const clientId = null;
const guildId = null;
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
const commands = [];

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
} else {
    client.login(process.env.NIGHTLY); // Nightly build
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

    // guild_list = client.guilds.cache.map(guild => guild.id);

    console.log(`Logged in as ${client.user.tag}! Monitoring ${client.guilds.cache.size} servers.`);
    client.user.setPresence({ activities: [{ name: `${prefix}status | ${prefix}help`, type: 'LISTENING' }] });
    client.user.setStatus("online");
    invite = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=2147502080&scope=applications.commands%20bot`;


    const rest = new REST({ version: '9' }).setToken(process.env.NIGHTLY);
    (async () => {
        try {
            if (guildId) {
                await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
            }
        } catch (err) {
            console.log("failed");
            console.error(err);
        }
    })();

});

client.on("guildCreate", (guild) => {
    // When the bot joins a server
    console.log(`Joined new guild: ${guild.id} (${guild.name})`);
    addGuildToData(guild);

    if (!checkPermissions(guild)) return; // Check if bot has permissions

    try {
        // Send welcome embed message
        const welcomeEmbed = new Discord.MessageEmbed()
            .setColor('#62B36F')
            .setAuthor('Steve', 'https://i.imgur.com/gb5oeQt.png')
            .setDescription(`Hello! I'm Steve, a bot designed to get and display your Minecraft server status!  Thanks for adding me to your server.  To view all my available commands, use \`${prefix} help\`.`)
            .setFooter('Made by Alienics#5796 👾');
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
    const serverID = guild.id.toString();
    let sql = "DELETE FROM guild_data WHERE guild_id = ?;";
    let vars = [serverID];
    const remove_guild = new SQL_Query(pool, sql, vars);
    remove_guild.query();
    return;
});

client.on("messageCreate", message => {

    // Check if message has bot prefix / mentions bot
    let sliceLen;
    if (message.content.startsWith(prefix)) {
        sliceLen = prefix.length;
    } else if (message.mentions.has(client.user.id) && !message.mentions.everyone) {
        sliceLen = 23;
    } else {
        return;
    }

    if (message.channel.type == "dm") return; // Ignore direct messages

    if (!checkPermissions(message.guild)) return; // Check if bot has permissions

    // Get guild ID and check if guild in database
    var serverID = message.guild.id.toString();
    let sql = ' SELECT * FROM guild_data WHERE guild_id = ? ';
    let vars = [serverID];
    let guild_exists = new SQL_Query(pool, sql, vars);
    guild_exists.query()
        .then((rows) => {
            if (rows.length === 0) {
                console.log(`Server ${serverID} (${message.guild.name}): Guild not found in database.  Adding to database.`);
                addGuildToData(message.guild);
            }
        })
        .catch((err) => {
            console.log("Error while checking if guild exists:");
            console.log(err);
        });

    // Separate command and arguments
    const commandBody = message.content.slice(sliceLen);
    const args = commandBody.split(' ');
    const commandName = args.shift().toLowerCase();

    // Grab commands and aliases
    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    if (!command) return; // Check if command in commands folder

    // Check if author has permission to execute commands
    if (command.permissions) {
        const perms = message.channel.permissionsFor(message.author);
        if (!perms || !perms.has(command.permissions)) {
            const adminEmbed = new Discord.MessageEmbed()
                .setColor('#E74C3C')
                .setAuthor('Steve', 'https://i.imgur.com/gb5oeQt.png')
                .setDescription(`Only administrators can make changes to Steve!`);
            return message.channel.send({ embeds: [adminEmbed] });
        }
    }

    // Command handler
    try {
        command.execute(Discord, pool, serverID, message, args, invite, prefix);
    } catch (error) {
        console.error(error);
        return message.channel.send({ content: 'There was an error trying to execute that command!' });
    }

});

function addGuildToData(guild) {
    // Create new row in guild_data table with guild ID as primary key
    let serverID = guild.id.toString();
    let sql = "INSERT INTO guild_data VALUES (?, 1, '25565', '', '', '', '-mc ');";
    let vars = [serverID];
    const add_guild = new SQL_Query(pool, sql, vars);
    add_guild.query()
        .catch((err) => {
            console.log(`\x1b[31m\x1b[1mError adding guild to database for guild ${serverID} (${guild.name}):\x1b[0m`);
            console.log(err);
            return;
        });
    return;
}

function createTable() {
    // Create new table if not already existing in database
    let sql = `CREATE TABLE IF NOT EXISTS guild_data (
        guild_id VARCHAR(18) NOT NULL,   
        query BOOLEAN NOT NULL DEFAULT 1,          
        port VARCHAR(5) NOT NULL DEFAULT '25565',   
        url VARCHAR(2048) DEFAULT '',   
        name VARCHAR(50) DEFAULT '',   
        footer VARCHAR(50) DEFAULT '',   
        prefix VARCHAR(10) NOT NULL DEFAULT '-mc ',   
        PRIMARY KEY ( guild_id )) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`;
    let create_table = new SQL_Query(pool, sql);
    create_table.query()
        .then(console.log(`Created new table.`))
        .catch((err) => {
            console.log("Failed to create new table");
            console.log(err);
        });
}

function checkPermissions(guild) {
    // Check if bot has permissions
    if (!guild.me.permissions.has(Permissions.FLAGS.SEND_MESSAGES)) {
        console.log(`Server ${guild.id.toString()} (${guild.name}): No permission to send messages.`);
        return false;
    }
    if (!guild.me.permissions.has(Permissions.FLAGS.EMBED_LINKS)) {
        console.log(`Server ${guild.id.toString()} (${guild.name}): No permission to embed links.`);
        guild.systemChannel.send('Please enable the `Embed Links` permission for the Steve role in your Discord server settings!');
        return false;
    }
    return true;
}

// Refresh client presence every hour
setInterval(() => {
    client.user.setPresence({ activities: [{ name: `${prefix}status | ${prefix}help`, type: 'LISTENING' }] });
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
});