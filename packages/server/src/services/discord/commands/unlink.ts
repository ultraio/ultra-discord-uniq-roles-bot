import { Interaction, SlashCommandBuilder } from 'discord.js';
import { Token } from '../../../interfaces/';
import * as Services from '../..';

const commandName = 'unlink';
const commandDescription = 'Unlink your blockchain id from the uniq bot';
const command = new SlashCommandBuilder().setName(commandName).setDescription(commandDescription);

/**
 * This function removes factory roles from a user.
 * @param {string} discordId - The Discord ID of the user.
 */
async function removeFactoryRoles(discordId: string): Promise<{ status: boolean; data: string }> {
    // Get all user roles
    const userData = await Services.discord.getMemberAndRoles(discordId);
    if (typeof userData === 'undefined') {
        return { status: false, data: 'Could not find discord user' };
    }

    // Loop through each role, and check if it's a factory role and remove it
    for (let role of userData.roles) {
        const response = await Services.database.factory.getFactoriesByRole(role);

        // If record not found, then this role is not a factory role - don't remove
        // We only keep factory roles in the db.
        if (!response.status || typeof response.data === 'string') {
            continue;
        }

        // If it's a factory role, remove the role from the user
        await userData.member.roles.remove(role, 'Unlinking blockchain ID');
    }
    return { status: true, data: 'Roles removed successfully' };
}

async function handleInteraction(interaction: Interaction) {
    if (!interaction.isRepliable()) {
        return;
    }

    if (!interaction.member) {
        return interaction.reply({
            content: 'Could not find user in ultra guild.',
            ephemeral: true, // Makes responses 'only you can see this'
        });
    }

    try {
        await interaction.deferReply({
            ephemeral: true, // Makes responses 'only you can see this'
        });

        // Get discord id from msg & remove user from db
        const userInDb = await Services.database.user.removeUser(interaction.member.user.id);
        if (!userInDb.status || typeof userInDb.data == 'string') {
            return interaction.editReply({
                content: `⚠️ Error: ${userInDb.data}`,
            });
        }

        // Remove all roles from this user
        const resp = await removeFactoryRoles(userInDb.data.discord);

        if (!resp.status) {
            return interaction.editReply({
                content: `⚠️ Error: ${resp.data}`,
            });
        }

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
