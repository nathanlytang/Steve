import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import path from "path";
import url from "url";
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];
const commandFiles = fs
    .readdirSync(path.join(__dirname, "../dist/src/lib"))
    .filter((file) => file.endsWith(".js"));

(async () => {
    if (process.argv.length > 2 && process.argv[2] === "dev") {
        // Put commands in collection
        const rest = new REST({ version: "9" }).setToken(process.env.NIGHTLY);
        for (const file of commandFiles) {
            const command = await import(`../dist/src/lib/${file}`);
            commands.push(await command.data.toJSON());
        }

        // Register guild commands
        try {
            await rest.put(
                Routes.applicationGuildCommands(
                    process.env.DEV_CLIENT,
                    process.env.DEV_GUILD
                ),
                { body: commands }
            );
            console.log("Dev slash commands registered");
        } catch (err) {
            console.error(err);
        }
    } else {
        // Put commands in collection
        const rest = new REST({ version: "9" }).setToken(
            process.env.DISCORD_TOKEN
        );
        for (const file of commandFiles) {
            const command = await import(`../dist/src/lib/${file}`);
            commands.push(await command.data.toJSON());
        }

        // Register guild commands
        try {
            await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
                body: commands,
            });
            console.log("Slash commands registered");
        } catch (err) {
            console.error(err);
        }
    }
})();
