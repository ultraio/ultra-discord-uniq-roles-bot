import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import * as Services from '../..';
import { isRoleEmpty } from '../../../interfaces/database';
import { getGuild, getRole } from '..';

const commandName = 'printrole';
const commandDescription = "Allows an admin to print requirements of a specific role";
const command = new SlashCommandBuilder()
    .setName(commandName)
    .setDescription(commandDescription)
    .addRoleOption((option) => option.setName('role').setDescription('role id').setRequired(false))
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

    try {
        const resp = role ?
            await Services.database.role.getDocumentByRole(role.id) :
            await Services.database.role.getAllDocuments();

        if (!resp.status) {
            return interaction.editReply({
                content: `⚠️ Error: ${resp.data}`,
            });
        }

        let isFirstReply: boolean = true;
        let resultString = '';
        if (typeof resp.data === 'string') {
            resultString = resp.data;
        } else {
            let roles = Array.isArray(resp.data) ? resp.data : [resp.data];
            for (let role of roles) {
                let roleData = await getRole(role.role);
                let appendString = '';
                appendString += `Role: ${roleData?.name} (${role.role})\n`;
                if (isRoleEmpty(role)) {
                    appendString += `Empty\n`;
                } else {
                    if (role.factories && role.factories.length) {
                        appendString += `Factories: ${JSON.stringify(role.factories)}\n`;
                    }
                    if (role.uosThreshold && role.uosThreshold > 0) {
                        appendString += `UOS threshold: ${role.uosThreshold}\n`;
                    }
                }
                appendString += `\n`;

                // Avoid hitting the message limit of Discord of 2000 characters, just in case
                // Check for a bit less than 2000 just to have a small buffer
                if (resultString.length + appendString.length > 1900) {
                    if (isFirstReply) {
                        isFirstReply = false;
                        await interaction.editReply({
                            content: `✅\n${resultString}`,
                        });
                    } else {
                        await interaction.followUp({
                            content: `✅\n${resultString}`,
                            ephemeral: true, // Makes responses 'only you can see this'
                        });
                    }
                    resultString = '';
                }
                resultString += appendString;
            }
        }

        if (isFirstReply) {
            return interaction.editReply({
                content: `✅\n${resultString}`,
            });
        } else {
            return interaction.followUp({
                content: `✅\n${resultString}`,
                ephemeral: true, // Makes responses 'only you can see this'
            });
        }
    } catch (error) {
        return interaction.editReply({
            content: `❌ Something went wrong. Error: ${error}`,
        });
    }
}

Services.discord.register(command, handleInteraction);
