const {MessageEmbed} = require('discord.js');
const {yellow} = require('../colors.json');

module.exports = {
    name: "ap",
    description: "ppap",
    args: false,
    cooldown: 60,
    userLevel: 0, // 0: everyone, 1: only pixel pizza staff, 2: directors and teachers, 3: only pixel pizza directors
    async execute(message, args, client){
        const clientMember = message.guild.members.cache.get(client.user.id);
        if (message.member.voice.channel && message.member.voice.channel.permissionsFor(clientMember).has("MUTE_MEMBERS")){
            clientMember.voice.setMute(false);
            const connection = await message.member.voice.channel.join();
            const dispatcher = connection.play("audio/ppap.mp3");
            dispatcher.on('start', () => {

            });

            dispatcher.on('finish', () => {
                connection.disconnect();
            });
            
            dispatcher.on('error', console.error);
        } else {
            const embedMsg = new MessageEmbed()
                .setColor(yellow)
                .setTitle("PPAP")
                .setDescription("click on the title")
                .setURL("https://www.youtube.com/watch?v=Ct6BUPvE2sM");
            
            message.channel.send(embedMsg);
        }
    }
}