const {MessageEmbed} = require('discord.js');
const mysql = require('mysql');
const {database, pizzaGuild} = require('../config.json');
const {red, blue} = require('../colors.json');

const dbconfig = {
    host: database.host,
    user: database.user,
    password: database.password,
    database: database.database
};

module.exports = {
    name: "leaderboard",
    description: "see the pixel pizza level leaderboard",
    minArgs: 0,
    maxArgs: 1,
    usage: "[page]",
    aliases: ["lb", "rankings"],
    execute(message, args, client){
        const embedMsg = new MessageEmbed().setColor(red);

        if (args.length){
            embedMsg
            .setTitle(`Not a number`)
            .setDescription(`'${args[0]}' is not a number!`);

            if (isNaN(parseInt(args[0]))){
                return message.channel.send(embedMsg);
            }
        }

        const pages = [];

        let page = 0;

        function addPage(){
            const embedMsg = new MessageEmbed()
            .setColor(blue)
            .setTitle(`Leaderboard`)
            .setDescription("```md\n")
            .setFooter(`Page ${page + 1}`);
            pages.push(embedMsg);
        }

        addPage();

        let rank = 0;
        let itemNumber = 0;
        const guild = client.guilds.cache.get(pizzaGuild);
        const con = mysql.createConnection(dbconfig);
        const sql = `SELECT user_id FROM levels ORDER BY lvl DESC, exp DESC, user_id`;
        con.query(sql, function(err, result) {
            if (err) throw err;
            console.log(result.length);
            if (!result.length) return con.end();
            for(let resultItem of result){
                rank++;
                itemNumber++;
                let member = guild.members.cache.get(resultItem.user_id);
                if (!member){
                    rank--;
                    continue;
                }
                let user = member.user;
                let rankString = `#${rank} • ${user.username}\n`;
                if (rank % 10 == 0 || itemNumber == result.length){
                    rankString = rankString + "```";
                }
                pages[page].setDescription(pages[page].description + rankString);
                if (rank % 10 == 0 && itemNumber != result.length){
                    page++;
                    addPage();
                }
            }
            if (!args.length) page = 1;
            else page = parseInt(args[0]);
            if (page < 1){
                embedMsg.setTitle("Page not found").setDescription(`Please use a page number higher than 0!`);
                return message.channel.send(embedMsg);
            }
            if (pages.length < page){
                embedMsg.setTitle("Page not found").setDescription(`page number ${page} could not be found. please use a lower number!`);
                return message.channel.send(embedMsg);
            }
            message.channel.send(pages[page - 1]).then(msg => {
                msg.react('⬅️').then(() => {
                    msg.react('➡️').then(() => {
                        const filter = (reaction, user) => user.id === message.author.id && reaction.emoji.name === '⬅️' || user.id === message.author.id && reaction.emoji.name === '➡️';
                        const collector = msg.createReactionCollector(filter);
                        collector.on('collect', r => {
                            switch(r.emoji.name){
                                case "⬅️":
                                    if (page == 1){
                                        page = pages.length;
                                    } else {
                                        page--;
                                    }
                                    break;
                                case "➡️":
                                    if (page == pages.length){
                                        page = 1;
                                    } else {
                                        page++;
                                    }
                                    break;
                                default:
                                    break;
                            }
                            msg.edit(pages[page - 1]);
                            msg.reactions.removeAll();
                            msg.react('⬅️').then(() => {
                                msg.react('➡️');
                            });
                        });
                    });
                });
            });
            con.end();
        });
    }
}