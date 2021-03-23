const Discord = require('discord.js');
require('dotenv').config();
const version = process.env.NODE_ENV;
const client = new Discord.Client();
const fs = require('fs');
const path = require("path");
const pool = require('../db/index');
const SQL_Query = require('../db/query');
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync(path.join(__dirname, 'lib')).filter(file => file.endsWith('.js'));
var invite;
const prefix = '-mc ';

// Put commands in collection
for (const file of commandFiles) {
    const command = require(path.join(__dirname, 'lib', file));
    client.commands.set(command.name, command);
}

if (version === 'production') {
    client.login(); // Production build
} else {
    client.login(process.env.NIGHTLY); // Nightly build
}

client.on('ready', () => {
    // Create database table if not exists
    let sql = " SHOW TABLES LIKE ? "
    let vars = ['guild_data'];
    let table_exists = new SQL_Query(pool, sql, vars);
    table_exists.query()
        .then((rows) => {
            if (rows.length === 1) {
                console.log('Database table detected. Using existing table.')
            } else if (rows.length === 0) {
                createtable();
            }
        })
        .catch((err) => {
            console.log("Error while checking if table exists.");
            console.log(err);
        })

    console.log(`Logged in as ${client.user.tag}! Monitoring ${client.guilds.cache.size} servers.`);
    client.user.setPresence({ activity: { name: `${prefix}status | ${prefix}help`, type: 'LISTENING' }, status: 'online' })
        .catch(console.error);
    invite = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=18432&scope=bot`;
});

client.on("guildCreate", (guild) => {
    // When the bot joins a server
    console.log(`Joined new guild: ${guild.id} (${guild.name})`);
    addGuildToData(guild);

    // Send welcome embed message
    const welcomeEmbed = new Discord.MessageEmbed()
        .setColor('#62B36F')
        .setAuthor('Steve', 'https://i.imgur.com/gb5oeQt.png')
        .setDescription(`Hello! I'm Steve, a bot designed to get and display your Minecraft server status!  Thanks for adding me to your server.  To view all my available commands, use \`${prefix} help\`.`)
        .setFooter('Made by Alienics#5796 👾')
    guild.systemChannel.send(welcomeEmbed);
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

client.on('message', message => {

    // Check if message has bot prefix / mentions bot
    if (message.content.startsWith(prefix)) {
        var sliceLen = prefix.length;
    } else if (message.mentions.has(client.user.id) && !message.mentions.everyone) {
        var sliceLen = 23;
    } else {
        return;
    }

    if (message.channel.type == "dm") return; // Ignore direct messages

    // Check if bot has permissions
    if (!message.guild.me.hasPermission("SEND_MESSAGES")) {
        console.log(`Server ${message.guild.id.toString()} (${message.guild.name}): No permission to send messages.`);
        return;
    }
    if (!message.guild.me.hasPermission("EMBED_LINKS")) {
        console.log(`Server ${message.guild.id.toString()} (${message.guild.name}): No permission to embed links.`);
        message.channel.send('Please enable the `Embed Links` permission for the Steve role in your Discord server settings!');
        return;
    }

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
            console.log("Error while checking if guild exists:")
            console.log(err);
        })

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
                .setDescription(`Only administrators can make changes to Steve!`)
            return message.channel.send(adminEmbed);
        }
    }

    // Command handler
    try {
        command.execute(Discord, pool, serverID, message, args, invite, prefix);
    } catch (error) {
        console.error(error);
        return message.channel.send('There was an error trying to execute that command!');
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
        })
    return;
}

function createtable() {
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
        })
}


process.on('SIGTERM', () => {
    console.log('SIGTERM signal received.');
    process.exit(0);
});
