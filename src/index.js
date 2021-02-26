const Discord = require('discord.js');
require('dotenv').config();
const version = process.env.NODE_ENV;
const client = new Discord.Client();
const fs = require('fs');
const path = require("path");
const data = "env.json";
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
    console.log(`Logged in as ${client.user.tag}! Monitoring ${client.guilds.cache.size} servers.`);
    client.user.setPresence({ activity: { name: `${prefix}status | ${prefix}help`, type: 'LISTENING' }, status: 'online' })
        .catch(console.error);
    invite = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=18432&scope=bot`;
});

client.on("guildCreate", (guild) => {
    // When the bot joins a server
    console.log(`Joined new guild: ${guild.id} (${guild.name})`);
    let { env, serverID } = addGuildToData(guild);
    const welcomeEmbed = new Discord.MessageEmbed()
        .setColor('#62B36F')
        .setAuthor('Steve', 'https://i.imgur.com/gb5oeQt.png')
        .setDescription(`Hello! I'm Steve, a bot designed to get and display your Minecraft server status!  Thanks for adding me to your server.  To view all my available commands, use \`${env[serverID].prefix} help\`.`)
        .setFooter('Made by Alienics 👾')
    guild.systemChannel.send(welcomeEmbed);
    return;
});

client.on("guildDelete", (guild) => {
    // When the bot is kicked or guild is deleted
    console.log(`Left guild: ${guild.id} (${guild.name})`);

    // Remove server ID from env.json
    const env = JSON.parse(fs.readFileSync(path.join(__dirname, data)));
    const serverID = guild.id.toString();
    delete env[serverID];
    fs.writeFileSync(path.join(__dirname, data), JSON.stringify(env));
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

    // Parse data file and get guild ID
    var serverID = message.guild.id.toString();
    console.log(`Server ${serverID} (${message.guild.name}) sent command: ${message.content}`);
    try {
        var env = JSON.parse(fs.readFileSync(path.join(__dirname, data)));
    } catch (err) {
        console.log(`Failed to parse env.json: ${err}`);
        return;
    }

    if (!env[serverID]) {
        var { env, serverID } = addGuildToData(message.guild); // If guild ID not added to data file
    }

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
        command.execute(Discord, env, serverID, message, args, invite);
    } catch (error) {
        console.error(error);
        return message.channel.send('There was an error trying to execute that command!');
    }

});

function addGuildToData(guild) {
    // Add server ID to data file
    const env = JSON.parse(fs.readFileSync(path.join(__dirname, data)));
    const serverID = guild.id.toString();
    var newGuild = { prefix: `${prefix}`, query: true, url: "", port: "25565", serverName: "", footer: "" };
    env[serverID] = newGuild;
    fs.writeFileSync(path.join(__dirname, data), JSON.stringify(env));
    return { env, serverID };
}
