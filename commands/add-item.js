const {MessageEmbed} = require('discord.js');
const {blue} = require('../colors.json');
const {emojis, pizzaGuild} = require('../config.json');

module.exports = {
    name: "add-item",
    description: "add an item in the shop",
    args: false,
    userLevel: 3, //0: everyone, 1: only pixel pizza staff, 2: directors and teachers, 3: only pixel pizza directors
    async execute(message, args, client){
        const embedMsgInfo = new MessageEmbed()
            .setColor(blue)
            .setTitle("Info Item")
            .setFooter("Type cancel to stop");

        const maxLengthName = 50;
        const maxLengthDesc = 500;
        const maxPrice = 500000000;
        const fieldNames = ["Name", "Price", "Description", "Time remaining", "Stock remaining", "Required role", "Given role", "Removes role", "Required balance"];
        const questions = ["What is the name of this item?\nThe maximum length is 50 characters", "What is the price of this item?\nThe maximum price is 500.000.000", "What is the description of this item?\nThe maximum length is 500 characters", "How long will this item stay in the shop?\nType `skip` to make it stay in the shop forever", "How much stock does this item have?\nType `skip` or `infinte` to make it have infinite stock", "What role is required to buy this item\nType `skip` if there is no required role", "What role does this item give?\nType `skip` if this item does not give a role", "What role does this item remove?\nType `skip` if this item does not remove a role", "What is the required balance to buy this item?\nType `skip` if there is no required balance for this item"];

        const guild = client.guilds.cache.get(pizzaGuild);
        const cross = guild.emojis.cache.get(emojis.red_cross);
        const numbers = [];
        emojis.numbers.forEach(emojiId => {
            numbers.push(guild.emojis.cache.get(emojiId));
        });

        async function newField(index, msg = null, errorMsg = null){
            let name = fieldNames[index];
            let question = questions[index];
            let number = numbers[index];
            if (!number){
                number = "";
            }
            if (!embedMsgInfo.fields[index]){
                embedMsgInfo.addField(name, '\u200B', true);
            }
            if (!msg){
                await message.channel.send(`${number} ${question}`, {embed: embedMsgInfo}).then(async msg => {
                    let filter = m => m.author === message.author;
                    msg.channel.awaitMessages(filter, {max: 1}).then(collected => {
                        let mess = collected.first();
                        if (mess.content.toLowerCase() === "cancel"){
                            return message.channel.send(`${cross} Canceled item creation`);
                        }
                        let error;
                        switch (name){
                            case "Name":
                                if (mess.content.length > maxLengthName){
                                    error = `${cross} The maximum name length of an item is ${maxLengthName}`;
                                }
                                break;
                            case "Price":
                                if (isNaN(mess.content)){
                                    error = `${cross} The price should be a number`;
                                } else if (parseInt(mess.content) < 0){
                                    error = `${cross} The price can not be lower than $0`;
                                } else if (parseInt(mess.content) > maxPrice){
                                    error = `${cross} The maximum price is ${maxPrice}`;
                                }
                            case "Description":
                                if (mess.content.length > maxLengthDesc){
                                    error = `${cross} The maximum description length of an item is ${maxLengthDesc}`;
                                }
                            case "Time remaining":
                                if (mess.content.toLowerCase() === "skip"){
                                    mess.content = "No time limit";
                                } else if (isNaN(mess.content.replace("h", "").replace("m", "").replace("s", ""))){
                                    error = `${cross} Remaining time needs a numeric value`;
                                }
                        }
                        if (error){
                            if (!errorMsg){
                                message.channel.send(error).then(errorMsg => {
                                    newField(index, msg, errorMsg);
                                });
                                return;
                            }
                            errorMsg.edit(error);
                            newField(index, msg, errorMsg)
                            return;
                        }
                        embedMsgInfo.fields[index].value = mess.content;
                        msg.edit(embedMsgInfo);
                        if (fieldNames[index + 1]){
                            newField(index + 1, msg, errorMsg);
                        }
                    });
                });
                return;
            }
            await msg.edit(`${number} ${question}`, {embed: embedMsgInfo}).then(async msg => {
                let filter = m => m.author === message.author;
                msg.channel.awaitMessages(filter, {max: 1}).then(collected => {
                    let mess = collected.first();
                    if (mess.content.toLowerCase() === "cancel"){
                        return message.channel.send(`${cross} Canceled item creation`);
                    }
                    let error;
                    switch (name){
                        case "Name":
                            if (mess.content.length > maxLengthName){
                                error = `${cross} The maximum name length of an item is ${maxLengthName}`;
                            }
                            break;
                        case "Price":
                            if (isNaN(mess.content)){
                                error = `${cross} The price should be a number`;
                            } else if (parseInt(mess.content) < 0){
                                error = `${cross} The price can not be lower than $0`;
                            } else if (parseInt(mess.content) > maxPrice){
                                error = `${cross} The maximum price is ${maxPrice}`;
                            }
                            mess.content = `$${mess.content}`;
                        case "Description":
                            if (mess.content.length > maxLengthDesc){
                                error = `${cross} The maximum description length of an item is ${maxLengthDesc}`;
                            }
                        case "Time remaining":
                            if (mess.content.toLowerCase() === "skip"){
                                mess.content = "No time limit";
                            } else if (isNaN(mess.content.replace("h", "").replace("m", "").replace("s", ""))){
                                error = `${cross} Remaining time needs a numeric value`;
                            }
                    }
                    if (error){
                        error += ". Please try again!";
                        if (!errorMsg){
                            message.channel.send(error).then(errorMsg => {
                                newField(index, msg, errorMsg);
                            });
                            return;
                        }
                        errorMsg.edit(error);
                        newField(index, msg, errorMsg);
                        return;
                    }
                    embedMsgInfo.fields[index].value = mess.content;
                    msg.edit(embedMsgInfo);
                    if (fieldNames[index + 1]){
                        newField(index + 1, msg, errorMsg);
                    }
                });
            });
        }
        
        await newField(0);
        console.log(embedMsgInfo);
    }
}