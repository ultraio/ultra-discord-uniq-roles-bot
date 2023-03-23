import { GuildMember, Interaction, RepliableInteraction, SlashCommandBuilder } from 'discord.js';
import * as Discord from '..';
import * as Utility from '../../../utility';

const commandName = 'link';
const commandDescription = 'Link your Discord ID to an Ultra Blockchain ID';
const command = new SlashCommandBuilder().setName(commandName).setDescription(commandDescription);
const config = Utility.config.get();

/**
 * It returns the URL of the signing service
 * @returns A string
 */
function generateSigningURL(): string {
    let host = config.CNAME;
    if (host.includes('http') || host.includes('https')) {
        return host + '/signMessage';
    }
    return `http://${host}:${config.WEBSERVER_PORT}/signMessage`;
}

async function handleInteraction(interaction: Interaction) {
    if (!interaction.isRepliable()) {
        return;
    }

    if (!interaction.member) {
        return interaction.reply(`Could not find member in server.`);
    }

    const member = Discord.getMember(interaction.member.user.id);
    const didSend = await member
        ?.send(`Follow the URL to continue your linking process: ${generateSigningURL()}`)
        .catch((err) => {
            return false;
        });

    if (!didSend) {
        return interaction.reply('A link could not be sent. Please open direct messages from guild members.');
    }

    return interaction.reply('A link was sent to your direct messages');
}

Discord.register(command, handleInteraction);
