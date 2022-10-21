import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import path from "path";
import url from "url";
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function register(local = false, prod = true) {
    const commandPath = local ? "../dist/src/lib" : "../src/lib"
    const commands = [];
    const commandFiles = fs
        .readdirSync(path.join(__dirname, commandPath))
        .filter((file) => file.endsWith(".js"));
    
    for (const file of commandFiles) {
        const command = await import(`${commandPath}/${file}`);
        commands.push(await command.data.toJSON());
    }

    if (prod) {
        // Put commands in collection
        const rest = new REST({ version: "9" }).setToken(
            process.env.DISCORD_TOKEN
        );
        // Register guild commands
        try {
            await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
                body: commands,
            });
            console.log("Slash commands registered");
            fs.writeFile('./results.txt', 'success\n', err => {
                if (err) {
                    console.error(err);
                }
            })
        } catch (err) {
            console.error(err);
        }
    } else if (!prod) {
        // Put commands in collection
        const rest = new REST({ version: "9" }).setToken(process.env.NIGHTLY);

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
        console.log("Not a valid option");
    }
};
