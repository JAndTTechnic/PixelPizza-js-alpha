const { MessageEmbed } = require('discord.js');
const mysql = require("mysql2");
const {blue, red} = require('../colors.json');
const {prefix} = require('../config.json');

module.exports = {
    name: "myorder",
    description: "see your current order",
    args: false,
    userLevel: 0, // 0: everyone, 1: only pixel pizza staff, 2: directors and teachers, 3: only pixel pizza directors
    execute(message, args, client){
        var seperator = '-';
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

        const embedMsg = new MessageEmbed()
            .setColor(red)
            .setTitle("**Order**")
            .setDescription(`You have not ordered anything use ${prefix}order to order a pizza`);

        let sql = `SELECT * FROM orders WHERE user_id = '${message.author.id}'`;
        con.query(sql, function(err, result){
            if (err) throw err;
            if (!result.length){
                con.end();
                return message.channel.send(embedMsg);
            }
            const guild = client.guilds.cache.get(result[0].guild_id);
            const channel = result[0].channel_id;
            embedMsg
                .setColor(blue)
                .setDescription(`***${result[0].order}***`)
                .addFields(
                    { name: "Orderer", value: message.author.tag },
                    { name: "Guild", value: guild.name, inline: true },
                    { name: "Ordered in channel", value: `<#${channel}>`, inline: true }
                )
                .setFooter(`id: ${result[0].order_id} ${seperator} status: ${result[0].status} ${seperator} cook: none ${seperator} deliverer: none`);
                
            if (result[0].cook_id){
                const cook = client.users.cache.get(result[0].cook_id);
                if (!cook) cook = {username: "deleted cook"};
                embedMsg.setFooter(embedMsg.footer.replace("cook: none", `cook: ${cook.username}`));
            }
            if (result[0].deliverer_id){
                const deliverer = client.users.cache.get(result[0].deliverer_id);
                if (!deliverer) deliverer = {username: "deleted deliverer"};
                embedMsg.setFooter(embedMsg.footer.replace("deliverer: none", `deliverer: ${deliverer.username}`));
            }
            message.channel.send(embedMsg);
            con.end();
        });
    }
}