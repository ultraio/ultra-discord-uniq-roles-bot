import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, ButtonInteraction, EmbedBuilder } from 'discord.js';
import * as Services from '../..';
import * as link from './link';

const commandName = 'hello';
const commandDescription = "Allows an admin to print bot's welcome message";
const command = new SlashCommandBuilder()
    .setName(commandName)
    .setDescription(commandDescription)
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
    if (!interaction.channel) {
        return interaction.reply({
            content: 'Not in a channel',
            ephemeral: true, // Makes responses 'only you can see this'
        });
    }

    try {
        const link = new ButtonBuilder()
			.setCustomId('link')
			.setLabel('Link Ultra Wallet')
			.setStyle(ButtonStyle.Primary);

        // const embed = new EmbedBuilder()
        //     .setColor(0x876CE4)
        //     .setTitle('Some title')
        //     .setURL('https://discord.js.org/')
        //     .setAuthor({ name: 'Some name', iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
        //     .setDescription('Click on the button bellow to verify your assets!')
        //     .setThumbnail('https://i.imgur.com/AfFp7pu.png')
        //     .addFields(
        //         { name: 'Regular field title', value: 'Some value here' },
        //         { name: '\u200B', value: '\u200B' },
        //         { name: 'Inline field title', value: 'Some value here', inline: true },
        //     )
        //     .addFields({ name: 'Inline field title', value: 'Some value here', inline: true })
        //     .setImage('https://i.imgur.com/AfFp7pu.png')
        //     .setTimestamp()
        //     .setFooter({ text: 'Some footer text here', iconURL: 'https://i.imgur.com/AfFp7pu.png' });

        await interaction.channel.send({
            content: `Click on the button bellow to verify your assets!`,
            //embeds: [embed],
            components: [new ActionRowBuilder<ButtonBuilder>().addComponents(link)],
        });

        return interaction.reply({
            content: `Posted a welcome message`,
            ephemeral: true
        });

    } catch (error) {
        return interaction.reply({
            content: `❌ Something went wrong. Error: ${error}`,
            ephemeral: true
        });
    }
}

async function handleButtonInteraction(interaction: ButtonInteraction) {
    if (!interaction.member) {
        return interaction.reply({
            content: 'Could not find user in ultra server.',
            ephemeral: true, // Makes responses 'only you can see this'
        });
    }

    try {
        const link = new ButtonBuilder()
			.setCustomId('link')
			.setLabel('Link Ultra Account')
			.setStyle(ButtonStyle.Primary);

		await interaction.reply({
			content: `Welcome message`,
			components: [new ActionRowBuilder<ButtonBuilder>({
                components: [link]
            })],
		});

    } catch (error) {
        return interaction.reply({
            content: `❌ Something went wrong. Error: ${error}`,
            ephemeral: true
        });
    }
}

Services.discord.register(command, handleInteraction, [{customId: 'link', callback: link.handleInteraction}]);
