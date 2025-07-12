import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import * as Services from '../..';

const commandName = 'setuosholderrole';
const commandDescription = `Allows an admin to set the UOS holder role with threshold, replacing any existing UOS holder role`;
const command = new SlashCommandBuilder()
    .setName(commandName)
    .setDescription(commandDescription)
    .addIntegerOption((option) =>
        option.setName('uos_threshold').setDescription('minimum amount of UOS required for this role').setRequired(true)
    )
    .addRoleOption((option) => option.setName('role').setDescription('role to assign to UOS holders').setRequired(true))
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
        // Set the UOS holder role (this will remove any existing one)
        const resp = await Services.database.role.setUosHolderRole(uosThreshold, role.id);
        if (!resp.status) {
            return interaction.editReply({
                content: `⚠️ Error: ${resp.data}`,
            });
        }

        let responseMessage = `✅ UOS holder role set successfully. Users with ${uosThreshold}+ UOS will receive the role: ${role.name} (${role.id}).`;

        return interaction.editReply({
            content: responseMessage,
        });
    } catch (error) {
        return interaction.editReply({
            content: `❌ Something went wrong. Error: ${error}`,
        });
    }
}

Services.discord.register(command, handleInteraction); 