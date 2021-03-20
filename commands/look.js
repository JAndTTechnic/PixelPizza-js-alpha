const { MessageEmbed } = require('discord.js');
const mysql = require("mysql");
const {blue, red} = require('../colors.json');
const {orderRoles, prefix} = require('../config.json');

module.exports = {
    name: "look",
    description: "look at an order",
    args: true,
    minArgs: 1,
    maxArgs: 1,
    usage: "<order id>",
    userLevel: 1, // 0: everyone, 1: only pixel pizza staff, 2: directors and teachers, 3: only pixel pizza directors
    execute(message, args, client){
        // TODO remake
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
            .setColor(blue)
            .setTitle("Look");

        if (args.length > 1){
            embedMsg.setColor(red).setDescription(`${prefix}${this.name} takes only one argument! The proper usage is ${prefix}${this.name} ${this.usage}`);
            return message.channel.send(embedMsg);
        }

        const id = args[0];
        let sql = `SELECT * FROM orders WHERE order_id = '${id}'`;
        con.query(sql, function(err, result) {
            if (err) throw err;
            if (!result.length){
                embedMsg.setColor(red).setDescription(`The order with the order id '${id}' doesn't exist!`);
                return message.channel.send(embedMsg);
            }
            const orderer = client.users.cache.get(result[0].user_id);
            if (!orderer){
                embedMsg
                    .setColor(red)
                    .setDescription(`The user that ordered this pizza does not have any mutual servers anymore. This order will be deleted!`);
                
                message.channel.send(embedMsg);
                sql = `DELETE FROM orders WHERE order_id = '${id}'`;
                con.query(sql, function(err, result){
                    if (err) throw err;
                    con.end();
                    embedMsg.setColor(blue).setDescription(`The order has been deleted`);
                    message.channel.send(embedMsg);
                });
                return;
            }
            const guild = client.guilds.cache.get(result[0].guild_id);
            const channel = result[0].channel_id;
            embedMsg
            .setTitle("**Order**")
            .setDescription(`***${result[0].order}***`)
            .addFields(
                {name: "Orderer", value: orderer.tag},
                {name: "Guild Name", value: guild.name, inline: true},
                {name: "Ordered in channel", value: `<#${channel}>`, inline: true }
            )
            .setFooter(`id: ${id}, status: ${result[0].status}, cook: none, deliverer: none`);
            if (result[0].cook_id){
                const cook = client.users.cache.get(result[0].cook_id);
                if (!cook) cook = {username: "deleted cook"};
                embedMsg.setFooter(embedMsg.footer.text.replace("cook: none", `cook: ${cook.username}`));
            }
            if (result[0].deliverer_id){
                const deliverer = client.users.cache.get(result[0].deliverer_id);
                if (!deliverer) deliverer = {username: "deleted deliverer"};
                embedMsg.setFooter(embedMsg.footer.text.replace("deliverer: none", `deliverer: ${deliverer.username}`));
            }
            message.channel.send(embedMsg);
            con.end();
        });
    }
}