import { Interaction, SlashCommandBuilder } from 'discord.js';
import { Endpoints } from '../../../types/endpointEnum';
import * as Services from '../..';
import * as Utility from '../../../utility';

const commandName = 'link';
const commandDescription = 'Link your Discord ID to an Ultra Blockchain ID';
const command = new SlashCommandBuilder().setName(commandName).setDescription(commandDescription);
const args = process.argv;

/**
 * It returns the URL of the signing service
 * @returns A string
 */
function generateSigningURL(hash: string, message: string): string {
    const config = Utility.config.get();
    const cnameHost = config.CNAME;

    // localhost
    // must be https to work with wallet
    let initialHost = `https://${cnameHost}:${args.includes('--mode=dev') ? config.VITE_PORT : config.WEBSERVER_PORT}`;

    // cname specific with https
    if (cnameHost.includes('http') || cnameHost.includes('https')) {
        initialHost = cnameHost;
    }

    // http://host:?port/verifySignature
    const callback = encodeURI(initialHost + Endpoints.VerifySignature);

    // http://host:?port/askToSign
    let url = initialHost + Endpoints.SignMessage;

    // http://host:?port/askToSign?cb=callback
    url += '?cb=' + callback;

    // http://host:?port/askToSign?cb=callback&hash=hash
    url += '&hash=' + hash;

    // http://host:?port/askToSign?cb=callback&hash=hash&message=
    url += '&message=' + message;
    return encodeURI(url.toString());
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

    const originalMessage = `${interaction.user.id} is linking their blockchain id to this service. By signing this message this confirms identification`;
    const messageRequest = Services.messageProvider.generate({
        discordUser: interaction.user.id,
        timestamp: Date.now(),
        originalMessage: originalMessage,
    });

    if (typeof messageRequest === 'undefined') {
        return interaction.reply({
            content: 'Existing linking request already exists, use the previous URL or wait some time to try again.',
            ephemeral: true, // Makes responses 'only you can see this'
        });
    }

    const encodedUrl = generateSigningURL(messageRequest, originalMessage);
    return interaction.reply({
        content: `Follow the URL to continue your linking process: ${encodedUrl}`,
        ephemeral: true, // Makes responses 'only you can see this'
    });
}

Services.discord.register(command, handleInteraction);
