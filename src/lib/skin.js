import Discord from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import fetch from 'node-fetch';

export const name = 'skin';
export const description = 'Get player skin';
export const data = new SlashCommandBuilder()
    .setName('skin')
    .setDescription('Get a player skin')
    .setDefaultPermission(true)
    .addStringOption(option =>
        option.setName("username")
            .setDescription("Minecraft Player Username")
            .setRequired(true));

export async function execute(pool, serverID, interaction, invite) {
    console.log(`Server ${serverID} (${interaction.guild.name}) sent skin command`);

    const user = interaction.options.getString('username');
    await interaction.deferReply();

    // Get UUID from API
    try {
        const uuidResponse = await fetch(`https://api.mojang.com/users/profiles/minecraft/${user}`);
        if (uuidResponse.status === 204) {
            return interaction.editReply({ content: `${user} is not a valid Minecraft username!` });
        }
        var playerInfo = await uuidResponse.json();
    } catch (err) {
        console.error(`Failed to fetch player skin: ${err}`);
        const fetchFailEmbed = new Discord.MessageEmbed()
            .setColor('#E74C3C')
            .setTitle('Failed to get player skin')
            .setDescription('Failed to get player skin.  Please try again in a few minutes.');
        return interaction.editReply({ embeds: [fetchFailEmbed] });
    }

    if (playerInfo.error === "Not Found") {
        return interaction.editReply({ content: `${user} is not a valid Minecraft username!` });
    }

    // Get skin from UUID
    try {
        const skinResponse = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${playerInfo.id}`);
        var skinInfo = await skinResponse.json();
        if (!skinInfo.errorMessage) {
            let textures = null;
            for (let i = 0; i < skinInfo.properties.length; i++) {
                if (skinInfo.properties[i].name === "textures") textures = i;
            }
            if (textures !== null) {
                var skin = JSON.parse(Buffer.from(skinInfo.properties[textures].value, "base64").toString()).textures.SKIN.url;
            }
        }
    } catch (err) {
        console.error(`Failed to get player skin: ${err}`);
    }

    // Create and send skin grab embed
    const skinEmbed = new Discord.MessageEmbed()
        .setColor('#62B36F')
        .setTitle(`${playerInfo.name}'s Minecraft Skin`)
        .setThumbnail(`https://crafatar.com/renders/body/${playerInfo.id}?overlay=true`)
        .setImage(skin ? skin : `https://crafatar.com/skins/${playerInfo.id}`)
        .addFields(
            { name: 'Download', value: `To download this skin, click [here](${skin ? skin : `https://minecraft.tools/download-skin/${playerInfo.name}`} "${playerInfo.name}'s skin").\n`, inline: true }
        );
    return interaction.editReply({ embeds: [skinEmbed] });
}