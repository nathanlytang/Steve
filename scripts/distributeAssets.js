import fs from "fs";

try {
    fs.cpSync("assets", "./dist/assets", { recursive: true });
} catch (err) {
    console.error(err);
}
