const {MessageEmbed} = require('discord.js');
const mysql = require("mysql2");
const {blue, red} = require('../colors.json');
const {pizzaGuild} = require('../config.json');

module.exports = {
    name: "deliverset",
    description: "set your delivery message",
    aliases: ['delset'],
    args: false,
    userLevel: 1, // 0: everyone, 1: only pixel pizza staff, 2: directors and teachers, 3: only pixel pizza directors
    execute(message, args, client){
        const embedMsg = new MessageEmbed()
            .setColor(blue)
            .setTitle("Set delivery message")
            .setDescription("please tell me your delivery message now");
        
        const ppGuild = client.guilds.cache.get(pizzaGuild);
        const member = ppGuild.members.cache.get(message.author.id);
        const deliver_role = ppGuild.roles.cache.get("709829482155868221");

        if (!member.roles.cache.get("709829482155868221")){
            embedMsg
                .setColor(red)
                .setDescription(`You need to have the role \`${deliver_role.name}\` to be able to set your delivery message!`);
            
            return message.channel.send(embedMsg);
        }

        embedMsg.addField("**Warning**", "*Do not forget to use {chef}, {customer}, {image} and {invite} so we will replace them with it!*");

        message.channel.send(embedMsg).then(() => {
            let filter = m => m.author === message.author;
            let collector = message.channel.createMessageCollector(filter, {max: 1});
            collector.on('collect', m => {
                const embedMsgFail = new MessageEmbed()
                        .setColor(red)
                        .setTitle("Set delivery message")
                        .setDescription("This delivery message does not contain {chef}, {customer}, {image} or {invite}! please try again!");
                    
                if (!m.content.includes("{chef}") || !m.content.includes("{image}") || !m.content.includes("{invite}") || !m.content.includes("{customer}")) {
                    return message.channel.send(embedMsgFail);
                }

                if ((m.content.match(/{chef}/g) || []).length > 2){
                    embedMsgFail.setDescription(`You can use {chef} 1 or 2 times! please try again!`);
                    return message.channel.send(embedMsgFail);
                }

                if ((m.content.match(/{image}/g) || []).length > 1 || (m.content.match(/{customer}/g) || []).length > 1 || (m.content.match(/{invite}/g) || []).length > 1){
                    embedMsgFail.setDescription(`You can use {customer}, {image} and {invite} 1 time! please try again!`);
                    return message.channel.send(embedMsgFail);
                }

                const invitePos = m.content.indexOf("{invite}", 7);
                console.log(invitePos);

                var con;

                var db_config = {
                    host: '37.59.55.185',
                    user: 'Krgdge3bYm',
                    password: 'T2nJhZlSAM',
                    database: 'Krgdge3bYm'
                };

                function handleDisconnect() {
                    con = mysql.createConnection(db_config); // Recreate the connection, since
                    // the old one cannot be reused.

                    con.connect(function (err) {              // The server is either down
                        if (err) {                                     // or restarting (takes a while sometimes).
                            console.log('error when connecting to db:', err);
                            setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
                        }                                     // to avoid a hot loop, and to allow our node script to
                    });                                     // process asynchronous requests in the meantime.
                    // If you're also serving http, display a 503 error.
                    con.on('error', function (err) {
                        console.log('db error', err);
                        if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
                            handleDisconnect();                         // lost due to either server restart, or a
                        } else {                                      // connnection idle timeout (the wait_timeout
                            throw err;                                  // server variable configures this)
                        }
                    });
                }

                handleDisconnect();

                let sql = `SELECT * FROM deliverers WHERE deliverer_discord_id = '${message.author.id}'`;
                con.query(sql, function(err, result){
                    if (err) throw err;
                    if (!result.length){
                        sql = `INSERT INTO deliverers()`
                    }
                });

                sql = `UPDATE deliverers SET delivery_message = ? WHERE deliverer_discord_id = '${message.author.id}'`;
                con.execute(sql, [`${m.content}`], function(err, result) {
                    if (err) throw err;
                });

                const embedMsgSucces = new MessageEmbed()
                    .setColor(blue)
                    .setTitle("Set delivery message")
                    .setDescription("You have succesfully set your new delivery message!");

                message.channel.send(embedMsgSucces);
            });
        });
    }
}