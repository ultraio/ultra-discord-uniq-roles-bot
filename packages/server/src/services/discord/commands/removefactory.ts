import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import * as Services from '../..';
import { factory as factoryDb } from '../../database';
import { dTokenFactory } from 'interfaces/database';

const commandName = 'rmvfactory';
const commandDescription = 'Allows an admin to remove a factory id and its corresponding discord role';
const command = new SlashCommandBuilder()
    .setName(commandName)
    .setDescription(commandDescription)
    .addIntegerOption((option) =>
        option.setName('factory_id').setDescription('ID of the factory to remove').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

async function handleInteraction(interaction: ChatInputCommandInteraction) {
    if (!interaction.isRepliable()) {
        return;
    }

    if (!interaction.member) {
        return interaction.reply({
            content: 'Could not find user in Discord Guild.',
            ephemeral: true, // Makes responses 'only you can see this'
        });
    }

    // Let the user know we're working on this request
    // If we don't use deferReply, we might run out of the 3 seconds reply time limit
    // We can hit the limit because of on-chain lookups or network latency in db operations
    await interaction.deferReply({
        ephemeral: true, // Makes responses 'only you can see this'
    });

    // Using non-null assertion operator (!) because if we get here, then these two values do exist
    // Because we're using .setRequired(true) when setting up the command options
    const factoryId = interaction.options.getInteger('factory_id')!;

    try {
        // Remove tokenFactory from db
        const resp = await factoryDb.removeFactory(factoryId);
        if (!resp.status) {
            return interaction.editReply({
                content: `⚠️ Error: ${resp.data}`,
            });
        }

        // Delete role from discord
        const roleToDelete = interaction.guild?.roles.cache
            .filter((r) => r.id == (resp.data as dTokenFactory).role)
            .at(0);

        if (!roleToDelete) {
            return interaction.editReply({
                content: `⚠️ Error: Unable to delete role because it doesn't exist anymore`,
            });
        }

        await roleToDelete.delete(`Deleting role because removing factory: ${factoryId}`);

        return interaction.editReply({
            content: `✅ Factory: ${factoryId} and role: ${roleToDelete.name} removed successfully`,
        });
    } catch (error) {
        return interaction.editReply({
            content: `❌ Something went wrong. Error: ${error}`,
        });
    }
}

Services.discord.register(command, handleInteraction);
