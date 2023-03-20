import { REST, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes } from 'discord.js';
import { Config } from 'interfaces';
import * as Utility from '../../utility';

export async function updateAllCommands(commands: RESTPostAPIChatInputApplicationCommandsJSONBody[]) {
    const config = (await Utility.config.get()) as Required<Config>;
    const rest = new REST({ version: '10' }).setToken(config.DISCORD_BOT_TOKEN);
    try {
        await rest.put(Routes.applicationGuildCommands(config.APPLICATION_ID, config.GUILD_ID), {
            body: commands,
        });

        Utility.log.info(`Successfully reloaded ${commands.length} application (/) commands.`);
    } catch (err) {
        console.log(err);
    }
}
