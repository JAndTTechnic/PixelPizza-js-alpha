const {MessageEmbed} = require('discord.js');
const {blue, red} = require('../colors.json');
const {prefix} = require('../config.json');

module.exports = {
    name: "backdoor",
    description: "get an invite link from a guild id",
    args: true,
    minArgs: 1,
    usage: "<guild>",
    userLevel: 3, // 0: everyone, 1: only pixel pizza staff, 2: directors and teachers, 3: only pixel pizza directors
    execute(message, args, client){
        const embedMsg = new MessageEmbed()
            .setTitle("Backdoor")
            .setColor(blue);

        const id = args[0];
        let guild = client.guilds.cache.get(id);
        if (!guild){
            guild = client.guilds.cache.find(guild => guild.name.toLowerCase().includes(args.join(" ").toLowerCase()));
            if (!guild){
                embedMsg
                .setColor(red)
                .setDescription(`This id or name is invalid or the bot isn't in that guild!`);

                return message.channel.send(embedMsg);
            }
        }

        guild.channels.cache.find(channel => channel.type == "text").createInvite({ maxAge: 0, maxUses: 0 }).then(invite => {
            message.channel.send(`https://discord.com/invite/${invite.code}`);
        });
    }
}