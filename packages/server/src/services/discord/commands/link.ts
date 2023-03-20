import { GuildMember, Interaction, RepliableInteraction, SlashCommandBuilder } from 'discord.js';
import * as Discord from '..';

const commandName = 'link';
const commandDescription = 'Link your Discord ID to an Ultra Blockchain ID';
const command = new SlashCommandBuilder().setName(commandName).setDescription(commandDescription);

async function handleInteraction(interaction: Interaction) {
    if (!interaction.isRepliable()) {
        return;
    }

    if (!interaction.member) {
        return interaction.reply(`Could not find member in server.`);
    }

    const member = Discord.getMember(interaction.member.user.id);
    const didSend = await member?.send(`This should be a link now. :)`).catch((err) => {
        return false;
    });

    if (!didSend) {
        return interaction.reply('A link could not be sent. Please open direct messages from guild members.');
    }

    return interaction.reply('A link was sent to your direct messages');
}

Discord.register(command, handleInteraction);
