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
            content: `✅ UOS threshold: ${uosThreshold} added with role: ${role.name} (${role.id}) successfully.`,
        });
    } catch (error) {
        return interaction.editReply({
            content: `❌ Something went wrong. Error: ${error}`,
        });
    }
}

Services.discord.register(command, handleInteraction);
