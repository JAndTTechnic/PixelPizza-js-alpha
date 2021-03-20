const {MessageEmbed} = require('discord.js');
const {rules} = require('../config.json');
const {blue, red} = require('../colors.json');

module.exports = {
    name: "rules",
    description: "look at the rules for pizzas",
    args: false,
    userLevel: 0, // 0: everyone, 1: only pixel pizza staff, 2: directors and teachers, 3: only pixel pizza directors
    execute(message, args, client) {
        const embedMsg = new MessageEmbed()
            .setTitle("Rules")
            .setColor(blue);

        const embedMsgDM = new MessageEmbed()
            .setTitle("Rules")
            .setColor(blue)
            .setDescription(`\`\`\`\n${rules.join("\n")}\`\`\``);

        return message.author.send(embedMsgDM)
        .then(() => {
            if (message.channel.type === 'dm') return;
            embedMsg.setDescription('I\'ve sent you a DM with all rules');
            message.channel.send(embedMsg);
        })
        .catch(error => {
            console.error(`Could not send rules DM to ${message.author.tag}.\n${error}`);
            embedMsg.setColor(red).setDescription('I can\'t DM you. Do you have DMs disabled?');
            message.channel.send(embedMsg);
        });
    }
}