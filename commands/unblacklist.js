const {MessageEmbed} = require('discord.js');
const mysql = require("mysql2");
const {blue, red} = require('../colors.json');
const {prefix} = require('../config.json');

module.exports = {
    name: "unblacklist",
    description: "unblacklist a user",
    aliases: ['unblack'],
    args: true,
    minArgs: 1,
    maxArgs: 1,
    usage: "<user mention | user id>",
    userLevel: 3, // 0: everyone, 1: only pixel pizza staff, 2: directors and teachers, 3: only pixel pizza directors
    execute(message, args, client){
        const embedMsg = new MessageEmbed()
            .setColor(blue)
            .setTitle("Blacklist");

        if (args.length > 1){
            embedMsg
                .setColor(red)
                .setDescription(`${prefix}${this.name} takes only one argument! The proper usage is ${prefix}${this.name} ${this.usage}`);
            
            return message.channel.send(embedMsg);
        }

        let user = message.mentions.users.first();
        if (!user){
            const id = args[0];
            if (isNaN(id)){
                embedMsg
                    .setColor(red)
                    .setDescription(`A user id only contains numebers!`);

                return message.channel.send(embedMsg);
            }
            if (id.length != 18){
                embedMsg
                    .setColor(red)
                    .setDescription(`A user id has a length of 18 characters!`);

                return message.channel.send(embedMsg);
            }
            user = client.users.cache.get(id);
            if (!user){
                embedMsg
                    .setColor(red)
                    .setDescription(`That id is invalid or the user doesn't have any mutual servers!`);

                return message.channel.send(embedMsg);
            }
        }

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

        let sql = `SELECT * FROM blacklisted WHERE discord_id = '${user.id}'`;
        con.query(sql, function(err, result) {
            if (err) throw err;
            if (!result.length){
                embedMsg
                    .setColor(red)
                    .setDescription(`That user isn't blacklisted!`);

                con.end();
                return message.channel.send(embedMsg);
            }
            sql = `DELETE FROM blacklisted WHERE discord_id = '${user.id}'`;
            con.query(sql, function(err, result) {
                if (err) throw err;
                embedMsg.setDescription(`${user.tag} has been unblacklisted!`);
                con.end();
                message.channel.send(embedMsg);
            });
        });
    }
}