import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import path from "path";
import url from 'url';
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];
const commandFiles = fs.readdirSync(path.join(__dirname, '../src/lib')).filter(file => file.endsWith('.js'));

const clientId = process.env.CLIENT_ID;

(async () => {

	// Put commands in collection
	const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);
	for (const file of commandFiles) {
		const command = await import(`../src/lib/${file}`);
		commands.push(command.data.toJSON());
	}

	// Register guild commands
	try {
		await rest.put(Routes.applicationCommands(clientId), { body: commands });
		console.log("Slash commands registered");
	} catch (err) {
		console.error(err);
	}

})();