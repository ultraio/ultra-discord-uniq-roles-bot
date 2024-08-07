import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Interaction, SlashCommandBuilder } from 'discord.js';
import { Endpoints } from '../../../types/endpointEnum';
import * as Services from '../..';
import * as Utility from '../../../utility';
import { getUser } from '../../../services/database/user';

const commandName = 'link';
const commandDescription = 'Link up with your Ultra Blockchain ID';
const command = new SlashCommandBuilder().setName(commandName).setDescription(commandDescription);
const args = process.argv;

/**
 * It returns the URL of the signing service
 * @returns A string
 */
function generateSigningURL(hash: string, message: string): string {
    const config = Utility.config.get();
    const cnameBotHost = config.CNAME;
    const cnameSigningHost = config.SIGNING_CNAME;
    const isUsingDevMode = args.includes('--mode=dev');

    // localhost
    // must be https to work with wallet
    // however, callback needs to be http while in dev mode
    let signingHost = `https://${cnameSigningHost}:${isUsingDevMode ? config.VITE_PORT : config.WEBSERVER_PORT}`;
    let callbackHost = `https://${cnameBotHost}:${config.WEBSERVER_PORT}`;

    // cname specific with https
    if (cnameBotHost.includes('http') || cnameBotHost.includes('https')) {
        callbackHost = cnameBotHost;
    }
    if (cnameSigningHost.includes('http') || cnameSigningHost.includes('https')) {
        signingHost = cnameSigningHost;
    }

    // http://host:?port/verifySignature
    const callback = encodeURI(
        (isUsingDevMode ? callbackHost.replace('https', 'http') : callbackHost) + Endpoints.VerifySignature
    );

    // http://host:?port/askToSign
    let url = signingHost + Endpoints.SignMessage;

    // http://host:?port/askToSign?cb=callback
    url += '?cb=' + callback;

    // http://host:?port/askToSign?cb=callback&hash=hash
    url += '&hash=' + hash;

    // http://host:?port/askToSign?cb=callback&hash=hash&message=
    url += '&message=' + message;
    return encodeURI(url.toString());
}

export async function handleInteraction(interaction: Interaction) {
    if (!interaction.isRepliable()) {
        return;
    }

    if (!interaction.member) {
        return interaction.reply({
            content: 'Could not find user in ultra server.',
            ephemeral: true, // Makes responses 'only you can see this'
        });
    }

    // TODO: allow multiple links to work properly
    const discordUserDocument = await getUser(interaction.user.id);
    if (discordUserDocument.status) {
        return interaction.reply({
            content: 'You have already linked some Ultra Account to your Discord account. Unlink existing link first.',
            ephemeral: true, // Makes responses 'only you can see this'
        });
    }

    const originalMessage = `${interaction.user.id} is linking their blockchain id to this service. By signing this message this confirms identification`;
    const messageRequest = Services.messageProvider.generate({
        discordUser: interaction.user.id,
        originalMessage: originalMessage,
    });

    if (typeof messageRequest === 'undefined') {
        return interaction.reply({
            content: 'Existing linking request already exists, use the previous URL or wait some time to try again.',
            ephemeral: true, // Makes responses 'only you can see this'
        });
    }

    const encodedUrl = generateSigningURL(messageRequest, originalMessage);
    const button = new ButtonBuilder().setLabel('Open Link').setURL(encodedUrl).setStyle(ButtonStyle.Link);
    const verify = new ButtonBuilder().setCustomId('verify').setLabel('Is my account linked?').setStyle(ButtonStyle.Secondary);

    return interaction.reply({
        content: `Click the button to begin linking to Ultra Blockchain.`,
        ephemeral: true, // Makes responses 'only you can see this'
        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(button, verify)],
    });
}

async function handleButtonInteraction(interaction: Interaction) {
    if (!interaction.isRepliable()) {
        return;
    }

    if (!interaction.member) {
        return interaction.reply({
            content: 'Could not find user in ultra server.',
            ephemeral: true, // Makes responses 'only you can see this'
        });
    }

    const discordUserDocument = await getUser(interaction.user.id);
    if (discordUserDocument.status) {
        return interaction.reply({
            content: '✅ Your Ultra Account is linked',
            ephemeral: true, // Makes responses 'only you can see this'
        });
    } else {
        return interaction.reply({
            content: '❌ Your Ultra Account is not linked',
            ephemeral: true, // Makes responses 'only you can see this'
        });
    }
}

Services.discord.register(command, handleInteraction, [{customId: 'verify', callback: handleButtonInteraction}]);
