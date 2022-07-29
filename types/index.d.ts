import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, PermissionResolvable } from "discord.js";
import { Pool } from "mariadb";

export interface Command {
    name: string;
    aliases: string[];
    description: string;
    data: SlashCommandBuilder;
    permissions: PermissionResolvable[];
    execute: (options: CommandOptions) => null;
}

export interface Cmd {
    aliases: string[];
}

export interface CommandOptions {
    pool: Pool;
    serverID: string;
    interaction: CommandInteraction;
    invite: string;
}

export interface PlayerInfo {
    name: string;
    id: string
}

export interface SkinInfo {
    id: string;
    name: string;
    properties: {
        name: string;
        value: string;
    }[]
}