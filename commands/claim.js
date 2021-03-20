const {MessageEmbed} = require('discord.js');
const mysql = require("mysql2");
const {orderRoles, prefix, channels, pizzaGuild} = require('../config.json');
const {blue, red} = require('../colors.json');

module.exports = {
    name: "claim",
    description: "claim an order to cook",
    args: true,
    minArgs: 1,
    maxArgs: 1,
    usage: "<order id>",
    userLevel: 1, // 0: everyone, 1: only pixel pizza staff, 2: directors and teachers, 3: only pixel pizza directors
    execute(message, args, client){
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

        function makeCook(){
            let sql = `INSERT INTO cooks(cook_discord_id, cook_name) VALUES('${message.author.id}', '${message.author.username}')`;
            con.query(sql, function(err, result){
                if (err) throw err;
            });
        }

        const embedMsg = new MessageEmbed()
            .setTitle("Claim")
            .setColor(blue);

        const ppGuild = client.guilds.cache.get(pizzaGuild);
        const member = ppGuild.members.cache.get(message.author.id);
        const cook_role = ppGuild.roles.cache.get("709745724052734015");
        
        if (!member.roles.cache.get("709745724052734015")){
            embedMsg
                .setColor(red)
                .setDescription(`You need to have the role \`${cook_role.name}\` in Pixel Pizza to be able to claim an order!`);
            
            con.end();
            return message.channel.send(embedMsg);
        }

        if (message.guild.id === pizzaGuild && message.channel.id != channels.order){
            embedMsg
                .setColor(red)
                .setTitle(`Wrong channel!`)
                .setDescription(`Please claim orders in <#${channels.order}>!`);

            con.end();
            return message.channel.send(embedMsg);
        }

        const id = args[0];
        let sql = `SELECT * FROM orders WHERE order_id = '${id}'`;
        con.query(sql, function(err, orderResult){
            if (err) throw err;
            if (!orderResult.length){
                embedMsg
                    .setColor(red)
                    .setDescription(`The order with order id '${id}' doesn't exist!`);
                
                con.end();
                return message.channel.send(embedMsg);
            }
            if (orderResult[0].cook_id){
                embedMsg
                    .setColor(red)
                    .setDescription(`The order with order id '${id}' has already been claimed!`);

                con.end();
                return message.channel.send(embedMsg);
            }
            const orderer = client.users.cache.get(orderResult[0].user_id);
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
            if (orderer.id === message.author.id){
                embedMsg
                    .setColor(red)
                    .setDescription(`You can't claim your own order!`);

                message.channel.send(embedMsg);
                con.end();
                return;
            }
            sql = `SELECT * FROM cooks WHERE cook_discord_id = '${message.author.id}'`;
            con.query(sql, function(err, result){
                if (err) throw err;
                if (!result.length){
                    makeCook();
                }
                sql = `UPDATE orders SET cook_id = '${message.author.id}', status = 'claimed' WHERE order_id = '${id}'`;
                con.query(sql, function(err) {
                    if (err) throw err;
                    embedMsg.setDescription(`You have claimed order id '${id}'`);
                    message.channel.send(embedMsg);
                    con.end();
                    const confirmation = new MessageEmbed()
                        .setTitle("Confirmation")
                        .setColor(blue)
                        .setDescription(`Your order has been claimed by <@${message.author.id}>`);

                    orderer.send(confirmation);
                });
            });
        });
    }
}