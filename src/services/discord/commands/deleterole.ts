import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import * as Services from '../..';

const commandName = 'deleterole';
const commandDescription = "Allows an admin to delete a role record from the database so it is no longer controlled by the bot";
const command = new SlashCommandBuilder()
    .setName(commandName)
    .setDescription(commandDescription)
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
    const role = interaction.options.getRole('role')!;

    try {
        // Remove role from db
        const resp = await Services.database.role.deleteRole(role.id);
        if (!resp.status) {
            return interaction.editReply({
                content: `⚠️ Error: ${resp.data}`,
            });
        }

        return interaction.editReply({
            content: `✅ Role link: ${role.id} removed successfully`,
        });
    } catch (error) {
        return interaction.editReply({
            content: `❌ Something went wrong. Error: ${error}`,
        });
    }
}

Services.discord.register(command, handleInteraction);
