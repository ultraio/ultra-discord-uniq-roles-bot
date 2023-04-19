import { Interaction, SlashCommandBuilder } from 'discord.js';
import * as Services from '../..';

const commandName = 'unlink';
const commandDescription = 'Unlink your blockchain ID to your discord account';
const command = new SlashCommandBuilder().setName(commandName).setDescription(commandDescription);

async function handleInteraction(interaction: Interaction) {
    if (!interaction.isRepliable()) {
        return;
    }

    if (!interaction.member) {
        return interaction.reply({
            content: 'Could not find user in Discord Guild.',
            ephemeral: true, // Makes responses 'only you can see this'
        });
    }

    try {
        await interaction.deferReply({
            ephemeral: true, // Makes responses 'only you can see this'
        });

        // Get discord id from msg & remove user from db
        const resp = await Services.database.user.removeUser(interaction.member.user.id);
        if (!resp.status) {
            return interaction.editReply({
                content: `⚠️ Error: ${resp.data}`,
            });
        }

        // Remove all roles from this user
        const thisUser = await Services.discord.getMember(interaction.member.user.id);
        await thisUser?.roles.set([], 'Removed all roles');

        return interaction.editReply({
            content: `✅ Account successfully unlinked.`,
        });
    } catch (error) {
        return interaction.editReply({
            content: `❌ Something went wrong. Error: ${error}`,
        });
    }
}

Services.discord.register(command, handleInteraction);
