import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, BaseInteraction } from 'discord.js';
import * as Services from '../..';

const commandName = 'adduosthreshold';
const commandDescription = `Allows an admin to bind current user's UOS balance to a role`;
const command = new SlashCommandBuilder()
    .setName(commandName)
    .setDescription(commandDescription)
    .addIntegerOption((option) =>
        option.setName('uos_threshold').setDescription('minimum amount of UOS required for this role').setRequired(true)
    )
    .addRoleOption((option) => option.setName('role').setDescription('role id').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

/**
 * Helper function to retrieve a factory object from either the v0 or v1 table based on the provided factory ID.
 * @param {number} factoryId - The factoryId to search for.
 * @returns a Promise that resolves to either the factory object, or null if it does not exist.
 */
async function getFactoryOnChain(factoryId: number): Promise<any> {
    let results: { rows: any[] };
    let factoryIndex = -1;

    // Check in v0 table first
    results = await Services.blockchain.getTableData('eosio.nft.ft', 'eosio.nft.ft', 'factory.a', factoryId, factoryId); // providing the factoryId as upper and lower bound works as a "WHERE factory.id = {factoryId}" filter
    if (!results) return null;
    factoryIndex = results.rows.findIndex((x) => x.id == factoryId);

    // if found in v0, return factory
    if (factoryIndex != -1) {
        return results.rows[factoryIndex];
    } else {
        // if not found in v0, check in v1
        results = await Services.blockchain.getTableData(
            'eosio.nft.ft',
            'eosio.nft.ft',
            'factory.b',
            factoryId,
            factoryId
        );

        if (!results) return null;
        factoryIndex = results.rows.findIndex((x) => x.id == factoryId);

        // if not found even in v1, return null as factory does not exist
        // else return factory object
        return factoryIndex == -1 ? null : results.rows[factoryIndex];
    }
}

async function handleInteraction(interaction: ChatInputCommandInteraction) {
    if (!interaction.isRepliable()) {
        return;
    }

    if (!interaction.member) {
        return interaction.reply({
            content: 'Could not find user in ultra server.',
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
    const uosThreshold = interaction.options.getInteger('uos_threshold')!;
    const role = interaction.options.getRole('role')!;

    try {
        // Check if threshold exists in database.
        const factoryInDb = await Services.database.role.getUosThreshold(uosThreshold);
        if (factoryInDb.status) {
            return interaction.editReply({
                content: `⚠️ Error: UOS threshold: ${uosThreshold} is already assigned to a role.`,
            });
        }

        // Add threshold to database
        const resp = await Services.database.role.addUosThreshold(uosThreshold, role.id);
        if (!resp.status) {
            return interaction.editReply({
                content: `⚠️ Error: ${resp.data}`,
            });
        }

        return interaction.editReply({
            content: `✅ UOS threshold: ${uosThreshold} added with role: ${role.name} successfully.`,
        });
    } catch (error) {
        return interaction.editReply({
            content: `❌ Something went wrong. Error: ${error}`,
        });
    }
}

Services.discord.register(command, handleInteraction);
