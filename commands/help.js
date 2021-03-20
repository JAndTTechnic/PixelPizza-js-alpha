const { prefix, orderRoles, staffCommands, pizzaGuild } = require('../config.json');
const {MessageEmbed} = require('discord.js');
const {blue, red} = require('../colors.json');

module.exports = {
    name: 'help',
    description: 'List of all commands',
    aliases: ['commands'],
    minArgs: 0,
    maxArgs: 1,
    usage: '[command name]',
    cooldown: 5,
    userLevel: 0, // 0: everyone, 1: only pixel pizza staff, 2: directors and teachers, 3: only pixel pizza directors
    execute(message, args, client) {
        const embedMsg = new MessageEmbed()
            .setColor(blue)
            .setAuthor(message.author.username, message.author.displayAvatarURL())
            .setThumbnail(message.author.displayAvatarURL())
            .setTimestamp()
            .setFooter(client.user.username, client.user.displayAvatarURL());

        const embedMsgDM = new MessageEmbed()
            .setColor(blue)
            .setTitle(`**${this.name}**`)
            .setAuthor(message.author.username, message.author.displayAvatarURL())
            .setThumbnail(message.author.displayAvatarURL())
            .setTimestamp()
            .setFooter(client.user.username, client.user.displayAvatarURL());

        const data = [];
        const { commands } = message.client;
        let noStaffCommands = commands.filter(command => command.userLevel == 0);

        let guild = client.guilds.cache.get(pizzaGuild);
        let anyRole = false;
        if (guild.members.cache.get(message.author.id)){
            const member = guild.members.cache.get(message.author.id);
            orderRoles.forEach(role => {
                if (member.roles.cache.get(role)){
                    anyRole = true;
                }
            });
        }

        if (!args.length) {
            if (anyRole){
                embedMsgDM
                    .setDescription(`\nYou can send '${prefix}${this.name} ${this.usage}' to get help for specific commands`)
                    .addField('all commands', commands.map(command => command.name).join(', '))
                    .addField('Commands amount', commands.size);
            } else {
                embedMsgDM
                    .setDescription(`\nYou can send '${prefix}${this.name} ${this.usage}' to get help for specific commands`)
                    .addField('all commands', noStaffCommands.map(command => command.name).join(', '))
                    .addField('Commands amount', noStaffCommands.size);
            }

            return message.author.send(embedMsgDM)
                .then(() => {
                    if (message.channel.type === 'dm') return;
                    embedMsg.setDescription('I\'ve sent you a DM with all commands');
                    message.channel.send(embedMsg);
                })
                .catch(error => {
                    console.error(`Could not send help DM to ${message.author.tag}.\n${error}`);
                    embedMsg.setColor(red).setDescription('I can\'t DM you. Do you have DMs disabled?');
                    message.channel.send(embedMsg);
                });
        }

        const name = args[0].toLowerCase();
        const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

        if (!command) {
            embedMsg.setColor(red).setDescription(`that's not a valid command!`);
            return message.channel.send(embedMsg);
        }

        if (!noStaffCommands.get(name) && !anyRole || !noStaffCommands.find(c => c.aliases && c.aliases.includes(name)) && !anyRole){
            embedMsg.setColor(red).setDescription(`That command is for workers only!`);
            return message.channel.send(embedMsg);
        }

        embedMsg.addField('**Name**', command.name);

        if (command.aliases) embedMsg.addField('**Aliases**', command.aliases.join(', '));
        if (command.description) embedMsg.addField('**Description**', command.description);
        if (command.usage) embedMsg.addField('**Usage**', `${prefix}${command.name} ${command.usage}`);

        embedMsg.addField('**Cooldown**', `${(command.cooldown || 0)} second(s)`);

        message.channel.send(embedMsg);
    },
};