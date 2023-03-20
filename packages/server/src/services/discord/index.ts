import * as I from '../../interfaces';
import * as Utility from '../../utility';
import { updateAllCommands } from './update';
import {
    Client,
    Guild,
    GuildMember,
    Interaction,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
    SlashCommandBuilder,
} from 'discord.js';

type InteractionCallback = (interaction: Interaction) => Promise<unknown>;

const client: Client = new Client({
    intents: ['Guilds', 'GuildMessages', 'GuildMembers'],
});

const commands: { [name: string]: { original: SlashCommandBuilder; callback: InteractionCallback } } = {};

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
 * Register a Slash Command
 *
 * @export
 * @param {SlashCommandBuilder} name
 * @param {(interaction: Interaction) => void} callback
 */
export function register(command: SlashCommandBuilder, callback: InteractionCallback) {
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
export function getMember(id: string): GuildMember | undefined {
    const guild = getGuild();
    if (typeof guild === 'undefined') {
        return undefined;
    }

    return guild.members.cache.get(id);
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

            await import('./commands').catch(() => {
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
