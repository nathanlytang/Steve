import fs from "fs";

try {
    fs.cpSync("assets", "./dist/assets", { recursive: true });
    fs.cpSync("scripts/registerSlashCommands.js", "./dist/scripts/registerSlashCommands.js")
} catch (err) {
    console.error(err);
}
