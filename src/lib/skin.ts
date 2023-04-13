import Discord, { PermissionFlagsBits } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import fetch from 'node-fetch';
import { CommandOptions, PlayerInfo, SkinInfo } from '../../types';

export const name = 'skin';
export const description = 'Get player skin';
export const data = new SlashCommandBuilder()
    .setName('skin')
    .setDescription('Get a player skin')
    .setDefaultMemberPermissions(PermissionFlagsBits.UseApplicationCommands)
    .addStringOption(option =>
        option.setName("username")
            .setDescription("Minecraft Player Username")
            .setRequired(true));

export async function execute(options: CommandOptions) {
    const { serverID, interaction } = options;
    console.log(`Server ${serverID} (${interaction.guild?.name}) sent skin command`);

    const user = interaction.options.get("username")?.value as string;
    await interaction.deferReply();

    // Get UUID from API
    let playerInfo: PlayerInfo;
    try {
        const uuidResponse = await fetch(`https://api.mojang.com/users/profiles/minecraft/${user}`);
        if (uuidResponse.status === 404) {
            return interaction.editReply({ content: `${user} is not a valid Minecraft username!` });
        }
        playerInfo = await uuidResponse.json() as PlayerInfo;
    } catch (err) {
        console.error(`Failed to fetch player skin: ${err}`);
        const fetchFailEmbed = new Discord.EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('Failed to get player skin')
            .setDescription('Failed to get player skin.  Please try again in a few minutes.');
        return interaction.editReply({ embeds: [fetchFailEmbed] });
    }

    // Get skin from UUID
    let skin = null;
    try {
        const skinResponse = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${playerInfo.id}`);
        if (skinResponse.status !== 400) {
            const skinInfo = await skinResponse.json() as SkinInfo;

            if (!skinInfo.properties) throw new Error("Failed to parse skin properties");

            for (const property of skinInfo.properties) {
                if (property.name === "textures") {
                    skin = JSON.parse(Buffer.from(property.value, "base64").toString()).textures.SKIN.url;
                    break;
                }
            }
            if (!skin) {
                throw new Error("Failed to parse skin texture");
            }
        }
    } catch (err) {
        console.error(`Failed to get player skin: ${err}`);
    }

    // Create and send skin grab embed
    const skinEmbed = new Discord.EmbedBuilder()
        .setColor('#62B36F')
        .setTitle(`${playerInfo.name}'s Minecraft Skin`)
        .setThumbnail(`https://crafatar.com/renders/body/${playerInfo.id}?overlay=true`)
        .setImage(skin ? skin : `https://crafatar.com/skins/${playerInfo.id}`)
        .addFields({ name: 'Download', value: `To download this skin, click [here](${skin ? skin : `https://minecraft.tools/download-skin/${playerInfo.name}`} "${playerInfo.name}'s skin").\n`, inline: true });
    return interaction.editReply({ embeds: [skinEmbed] });
}