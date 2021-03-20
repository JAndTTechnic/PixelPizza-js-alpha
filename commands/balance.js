const {MessageEmbed} = require('discord.js');
const mysql = require('mysql');
const {red} = require('../colors.json');
const {currency, database} = require('../config.json');

const db_config = {
    host: database.host,
    user: database.user,
    password: database.password,
    database: database.database
};

module.exports = {
    name: "balance",
    description: "shows your balance",
    minArgs: 0,
    usage: "[user]",
    aliases: ["bal", "money"],
    userLevel: 0,
    execute(message, args, client){
        const embedMsg = new MessageEmbed()
        .setColor(red)
        .setTitle("User not found")
        .setDescription(`Could not find user`);

        let user = message.author;
        if (args.length){
            if (message.mentions.users.first()){
                user = message.mentions.users.first();
            } else if (!isNaN(parseInt(args[0]))){
                user = client.users.cache.get(args[0]);
            } else {
                let username = args.toString().replace(",", " ");
                user = client.users.cache.find(user => user.username.toLowerCase().includes(username.toLowerCase()));
            }
            if (!user){
                return message.channel.send(embedMsg);
            }
        }

        const con = mysql.createConnection(db_config);
        const sql = `SELECT money FROM economy WHERE user_id = '${user.id}'`;
        con.query(sql, function(err, result) {
            if (err) throw err;
            if (!result.length){
                embedMsg.setDescription(`Could not find this user in Pixel Pizza`);
                con.end();
                return message.channel.send(embedMsg);
            }
            message.channel.send(`${user.username}s balance is ${currency}${result[0].money}`);
        });
    }
}