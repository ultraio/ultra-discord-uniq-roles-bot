import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import * as Services from '../..';
import { getRole } from '..';

const commandName = 'deleterole';
const commandDescription = "Allows an admin to delete a role record from the database so it is no longer controlled by the bot";
const command = new SlashCommandBuilder()
    .setName(commandName)
    .setDescription(commandDescription)
    .addRoleOption((option) => option.setName('role').setDescription('Role id').setRequired(false))
    .addStringOption((option) =>
        option.setName('role_id').setDescription('Numeric ID of the role').setRequired(false)
    )
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

    const role = interaction.options.getRole('role');
    const roleNumericId = interaction.options.getString('role_id');

    try {
        if ((role && roleNumericId) || (!role && !roleNumericId)) {
            return interaction.editReply({
                content: `⚠️ Error: specify either one of "role" or "role_id"`,
            });
        }

        // Remove role from db
        if (role) {
            const resp = await Services.database.role.deleteRole(role.id);
            if (!resp.status) {
                return interaction.editReply({
                    content: `⚠️ Error: ${resp.data}`,
                });
            }

            return interaction.editReply({
                content: `✅ Role link: ${role.name} (${role.id}) removed successfully`,
            });
        }
        if (roleNumericId) {
            const resp = await Services.database.role.deleteRole(roleNumericId);
            if (!resp.status) {
                return interaction.editReply({
                    content: `⚠️ Error: ${resp.data}`,
                });
            }

            let roleData = await getRole(roleNumericId);

            return interaction.editReply({
                content: `✅ Role link: ${roleData?.name} (${roleNumericId}) removed successfully`,
            });
        }
    } catch (error) {
        return interaction.editReply({
            content: `❌ Something went wrong. Error: ${error}`,
        });
    }
}

Services.discord.register(command, handleInteraction);
