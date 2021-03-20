const {MessageEmbed} = require('discord.js');
const {apply, channels} = require('../config.json');
const {blue, red} = require('../colors.json');

module.exports = {
    name: "apply",
    description: "apply for worker or developer",
    args: true,
    minArgs: 1,
    maxArgs: 1,
    usage: "<apply type (worker or developer)>",
    userLevel: 0,
    execute(message, args, client){
        const filter = m => m.author === message.author;
        
        const embedMsg = new MessageEmbed()
            .setTitle("Apply")
            .setColor(blue);

        const embedMsgAnswers = new MessageEmbed()
        .setColor(blue)
        .setTitle('Application')
        .setAuthor(message.author.tag, message.author.displayAvatarURL());

        const types = ["worker", "developer"];
        const user = message.author;
        switch(args[0]){
            case "dev":
                args[0] = "developer";
                break;
            case "cook":
                args[0] = "worker";
                break;
            case "chef":
                args[0] = "worker";
                break;
            case "deliver":
                args[0] = "worker";
                break;
            case "deliverer":
                args[0] = "worker";
                break;
        }
        const devQuestions = new Array();
        apply.dev.forEach(question => {
            devQuestions.push(question);
        });
        const workerQuestions = new Array();
        apply.worker.forEach(question => {
            workerQuestions.push(question);
        });

        function stopQuestions(type){
            let channel;
            switch(type){
                case "worker":
                    channel = client.channels.cache.get(channels.applications.worker);
                    break;
                case "developer":
                    channel = client.channels.cache.get(channels.applications.developer);
                    break;
            }
            channel.send(embedMsgAnswers);
            embedMsg.setDescription(`Your application has been submitted`).setFooter("");
            user.send(embedMsg);
        }

        function askQuestion(type){
            let question;
            switch(type){
                case "worker":
                    question = workerQuestions[Math.floor(Math.random() * workerQuestions.length)];
                    workerQuestions.splice(workerQuestions.indexOf(question), 1);
                    embedMsg.setDescription(question).setFooter(`Type cancel to cancel the application`);
                    user.send(embedMsg).then(msg => {
                        const collector = msg.channel.createMessageCollector(filter, {max: 1});
                        collector.on('collect', msg => {
                            if (msg.content.toLowerCase() === "cancel"){
                                return;
                            }
                            embedMsgAnswers.addField(question, msg.content);
                            if (workerQuestions.length){
                                askQuestion(type);
                            } else {
                                stopQuestions(type);
                            }
                        });
                    });
                    break;
                case "developer":
                    question = devQuestions[Math.floor(Math.random() * devQuestions.length)];
                    devQuestions.splice(devQuestions.indexOf(question), 1);
                    embedMsg.setDescription(question);
                    user.send(embedMsg).then(msg => {
                        const collector = msg.channel.createMessageCollector(filter, {max: 1});
                        collector.on('collect', msg => {
                            if (msg.content.toLowerCase() === "cancel"){
                                return;
                            }
                            embedMsgAnswers.addField(question, msg.content);
                            if (devQuestions.length){
                                askQuestion(type);
                            } else {
                                stopQuestions(type);
                            }
                        });
                    });
                    break;
            }
        }

        switch(args[0]){
            case "developer":
                embedMsg.setFooter(`Type cancel to cancel the application`);
                askQuestion("developer");
                break;
            case "worker":
                const question = workerQuestions.shift();
                embedMsg.setDescription(question).setFooter(`Type cancel to cancel the application`);
                user.send(embedMsg).then(msg => {
                    const collector = msg.channel.createMessageCollector(filter, {max: 1});
                    collector.on('collect', msg => {
                        if (msg.content.toLowerCase() === "cancel"){
                            return;
                        }
                        embedMsgAnswers.addField(question, msg.content);
                        askQuestion("worker");
                    });
                });
                break;
            default:
                embedMsg
                    .setColor(red)
                    .setDescription(`'${args[0]}' is not a valid apply type! all apply types are ${types.join(", ")}`);
                
                message.channel.send(embedMsg);
                break;
        }
        return message.delete();
    }
}