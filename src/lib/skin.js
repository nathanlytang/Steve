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
    const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${user}`);
    try {

        if (response.status === 204) {
            return interaction.editReply({ content: `${user} is not a valid Minecraft username!` });
        }

        var playerInfo = await response.json();
    } catch (err) {
        console.log(`Failed to fetch player skin: ${err}`);
        const fetchFailEmbed = new Discord.MessageEmbed()
            .setColor('#E74C3C')
            .setTitle('Failed to get player skin')
            .setDescription('Failed to get player skin.  Please try again in a few minutes.');
        interaction.editReply({ embeds: [fetchFailEmbed] });
        return;
    }

    if (playerInfo.error === "Not Found") {
        return interaction.editReply({ content: `${user} is not a valid Minecraft username!` });
    }

    // Create and send skin grab embed
    const skinEmbed = new Discord.MessageEmbed()
        .setColor('#62B36F')
        .setTitle(`${user}'s Minecraft Skin`)
        .setThumbnail(`https://crafatar.com/renders/body/${playerInfo.id}?overlay=true`)
        .setImage(`https://crafatar.com/skins/${playerInfo.id}`)
        .addFields(
            { name: 'Download', value: `To download this skin, click [here](https://minecraft.tools/download-skin/${playerInfo.name} "${user}'s skin").\n`, inline: true }
        );
    interaction.editReply({ embeds: [skinEmbed] });

    return;
}