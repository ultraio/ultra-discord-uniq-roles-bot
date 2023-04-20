import { Interaction, SlashCommandBuilder } from 'discord.js';
import { Token } from '../../../interfaces/';
import * as Services from '../..';

const commandName = 'unlink';
const commandDescription = 'Unlink your blockchain ID to your discord account';
const command = new SlashCommandBuilder().setName(commandName).setDescription(commandDescription);

/**
 * This function removes factory roles from a user.
 * @param {string} discordId - The Discord ID of the user.
 * @param {string} blockchainId - The blockchain ID of the user
 */
async function removeFactoryRoles(discordId: string, blockchainId: string): Promise<{ status: boolean; data: string }> {
    const tokenTables = ['token.a', 'token.b'];

    // Get all user tokens
    let tokens: Array<Token> = [];

    for (let table of tokenTables) {
        const rows = await Services.blockchain.getAllTableData<Token>('eosio.nft.ft', blockchainId, table);
        if (!Array.isArray(rows)) {
            continue;
        }

        tokens = tokens.concat(rows);
    }

    // Remove duplicates
    const tokenIds = [
        ...new Set(
            tokens.map((x) => {
                return x.token_factory_id;
            })
        ),
    ];

    // Get all user roles
    const userData = await Services.discord.getMemberAndRoles(discordId);
    if (typeof userData === 'undefined') {
        return { status: false, data: 'Could not find discord user' };
    }

    // Loop through each role, and check if it's a factory role and remove it
    for (let role of userData.roles) {
        const response = await Services.database.factory.getFactoryByRole(role);

        // If record not found, then this role is not a factory role - don't remove
        if (!response.status || typeof response.data === 'string') {
            continue;
        }

        const factoryId = response.data.factory;
        const tokenIndex = tokenIds.findIndex((tokenId) => tokenId === factoryId);

        // remove the role
        await userData.member.roles.remove(role, 'Unlinking blockchain ID');
        tokenIds.splice(tokenIndex, 1);
    }
    return { status: true, data: 'Roles removed successfully' };
}

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
        const userInDb = await Services.database.user.removeUser(interaction.member.user.id);
        if (!userInDb.status || typeof userInDb.data == 'string') {
            return interaction.editReply({
                content: `⚠️ Error: ${userInDb.data}`,
            });
        }

        // Remove all roles from this user
        const resp = await removeFactoryRoles(userInDb.data.discord, userInDb.data.blockchain);

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
