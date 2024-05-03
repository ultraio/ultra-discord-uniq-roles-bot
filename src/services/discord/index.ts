import * as I from '../../interfaces';
import * as Utility from '../../utility';
import { updateAllCommands } from './update';
import { deleteRole } from '../database/role';
import {
    ChatInputCommandInteraction,
    Client,
    Guild,
    GuildMember,
    Interaction,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
    Role,
    SlashCommandBuilder,
} from 'discord.js';

type InteractionCallback = (interaction: Interaction) => Promise<any>;
type ChatInputCommandInteractionCallback = (interaction: ChatInputCommandInteraction) => Promise<any>;

const client: Client = new Client({
    intents: ['Guilds', 'GuildMessages', 'GuildMembers', 'GuildModeration'],
});

const commands: {
    [name: string]: {
        original: SlashCommandBuilder;
        callback: InteractionCallback | ChatInputCommandInteractionCallback;
    };
} = {};

/**
 * Handles slash command interactions.
 *
 * @param {Interaction} interaction
 */
async function handleInteraction(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    const existingCommand = commands[interaction.commandName];
    if (!existingCommand) {
        return;
    }

    try {
        await existingCommand.callback(interaction);
    } catch (err) {
        Utility.log.warn(`Error while executing command ${existingCommand.original.name}: ${err}`);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                //
                content: 'There was an error while executing this command!',
                ephemeral: true,
            });
        } else {
            await interaction.reply({
                //
                content: 'There was an error while executing this command!',
                ephemeral: true,
            });
        }
    }
}

/**
 * Handles role deletion from discord.
 * Will check if that role is assigned to any factories and will delete the role object from db.
 *
 * @param {Interaction} interaction
 */
async function handleRoleDelete(role: Role) {
    try {
        Utility.log.info(`handleRoleDelete for role [${role.name} - ${role.id}]`);

        // Delete role if it exists in the db (i.e if it's a factory role)
        // deleteRole method handles all the validation and edge cases
        await deleteRole(role.id);
    } catch (error) {
        Utility.log.info(`Role [${role.name} - ${role.id}] deletion failed due to error: ${error}`);
    }
}

/**
 * Register a Slash Command
 *
 * @export
 * @param {SlashCommandBuilder} name
 * @param {(interaction: Interaction) => void} callback
 */
export function register(
    command: SlashCommandBuilder,
    callback: InteractionCallback | ChatInputCommandInteractionCallback
) {
    Utility.log.info(`Added Command: ${command.name}`);
    commands[command.name] = {
        original: command,
        callback,
    };
}

/**
 * Return the Discord Client
 *
 * @export
 * @return {Client}
 */
export function getClient(): Client {
    return client;
}

/**
 * Get the current Discord Guild where this bot is located.
 *
 * @export
 * @return {(Guild | undefined)}
 */
export function getGuild(): Guild | undefined {
    const config = Utility.config.get() as Required<I.Config>;
    return client.guilds.cache.get(config.GUILD_ID);
}

/**
 * Get a member that is currently in the discord server where the bot is located.
 *
 * @export
 * @param {string} id
 * @return {(GuildMember | undefined)}
 */
export async function getMember(id: string): Promise<GuildMember | undefined> {
    const guild = getGuild();
    if (typeof guild === 'undefined') {
        return undefined;
    }

    try {
        const member = await guild.members.fetch({ user: id });
        return member;
    } catch (err) {
        return undefined;
    }
}

/**
 * Get member roles.
 *
 * Returns undefined if not found.
 *
 * @export
 * @param {string} discord
 * @return {Promise<string[]>}
 */
export async function getMemberAndRoles(
    discord: string
): Promise<{ member: GuildMember; roles: string[] } | undefined> {
    const member = await getMember(discord);
    if (typeof member === 'undefined') {
        return undefined;
    }

    const roles = member.roles.cache.map((role) => {
        return role.id;
    });

    return { member, roles };
}

/**
 * Initializes a Discord Client with a bot token, and returns true if the bot has authenticated successfully.
 *
 * @export
 * @param {string} token
 * @return {Promise<boolean>}
 */
export async function init(token: string): Promise<boolean> {
    return new Promise((resolve: (result: boolean) => void) => {
        Utility.log.info('Attempting to authenticate');

        const handleError = (err: Error) => {
            Utility.log.error(`Invalid Token, did not Authenticate`);
            client.off('ready', handleReady);
            return resolve(false);
        };

        const handleReady = async () => {
            Utility.log.info(`Authenticated`);
            Utility.log.info(`Discord Bot is Running`);
            client.off('error', handleError);
            client.on('interactionCreate', handleInteraction);
            client.on('roleDelete', handleRoleDelete);

            await import('./commands').catch((err) => {
                Utility.log.error(`Error: ${err}`);
                Utility.log.error(`Could not find commands to import.`);
            });

            const commandList: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
            Object.keys(commands).forEach((key) => {
                commandList.push(commands[key].original.toJSON());
            });

            updateAllCommands(commandList);
            return resolve(true);
        };

        client.once('ready', handleReady);
        client.once('error', handleError);
        client.login(token);
    });
}
