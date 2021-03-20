const {MessageEmbed} = require('discord.js');
const mysql = require("mysql2");
const {blue, red} = require('../colors.json');
const {prefix, pizzaGuild} = require('../config.json');

module.exports = {
    name: "deliver",
    description: "deliver an order",
    aliases: ['del'],
    args: true,
    minArgs: 1,
    maxArgs: 1,
    usage: "<order id>",
    userLevel: 1, // 0: everyone, 1: only pixel pizza staff, 2: directors and teachers, 3: only pixel pizza directors
    async execute(message, args, client){
        const embedMsg = new MessageEmbed()
            .setColor(blue)
            .setTitle("Deliver");
        
        const ppGuild = client.guilds.cache.get(pizzaGuild);
        const member = ppGuild.members.cache.get(message.author.id);
        const deliver_role = ppGuild.roles.cache.get("709829482155868221");

        if (!member.roles.cache.get("709829482155868221")){
            embedMsg
                .setColor(red)
                .setDescription(`You need to have the role \`${deliver_role.name}\` to be able to deliver!`);
            
            return message.channel.send(embedMsg);
        }

        if (args.length > 1){
            embedMsg
                .setColor(red)
                .setDescription(`${prefix}${this.name} takes only one argument! The proper usage is ${prefix}${this.name} ${this.usage}`);
            
            return message.channel.send(embedMsg);
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

        let sql = `SELECT * FROM deliverers WHERE deliverer_discord_id = '${message.author.id}'`;
        con.query(sql, async function(err, result) {
            if (err) throw err;
            if (!result.length){
                sql = `INSERT INTO deliverers(deliverer_discord_id, deliverer_name) VALUES('${message.author.id}', '${message.author.username}')`;
                con.query(sql, function(err, result) {
                    if (err) throw err;
                    embedMsg
                        .setColor(red)
                        .setDescription(`You have not set a delivery message yet! please set it with ppdelset`);

                    return message.channel.send(embedMsg);
                });
            }
        });

        const id = args[0];

        sql = `SELECT delivery_message FROM deliverers WHERE deliverer_discord_id = '${message.author.id}'`;
        con.query(sql, function(err, deliverResult) {
            if (err) throw err;
            if (!deliverResult[0].delivery_message){
                embedMsg
                    .setColor(red)
                    .setDescription(`You have not set a delivery message yet. please set one with ppdelset and follow the instructions!`);

                return message.channel.send(embedMsg);
            }
            sql = `SELECT * FROM orders WHERE order_id = '${id}'`;
            con.query(sql, function(err, orderResult) {
                if (err) throw err;
                if (!orderResult.length){
                    embedMsg
                        .setColor(red)
                        .setDescription(`The order with order id '${id}' doesn't exist!`);

                    return message.channel.send(embedMsg);
                }
                if (orderResult[0].status != "cooked"){
                    embedMsg.setColor(red);
                    if (orderResult[0].status == 'cooking'){
                        embedMsg.setDescription(`This order is still cooking! Please wait until it's done cooking`);
                    } else if (orderResult[0].status == "claimed" ) {
                        embedMsg.setDescription(`This order has not started cooking yet!`);
                    } else if (orderResult[0].status == "delivering"){
                        embedMsg.setDescription(`This order is already being delivered!`);
                    } else {
                        embedMsg.setDescription(`This order has not been claimed by a cook yet!`);
                    }
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
                        .setDescription(`You can't deliver your own order!`);

                    return message.channel.send(embedMsg);
                }
                sql = `UPDATE orders SET deliverer_id = '${message.author.id}', status = 'delivering' WHERE order_id = '${id}'`;
                con.query(sql, function(err) {
                    if (err) throw err;
                    if (!orderResult[0].cook_id){
                        let chef = "deleted chef";
                        let customer = orderResult[0].user_id;
                        let image = orderResult[0].image_url;
                        let guildInvite = `https://discord.gg/${orderResult[0].guild_invite}`;
                        let invite = "AW7z9qu";
                        let deliverMessage = deliverResult[0].delivery_message.replace("{chef}", chef).replace("{customer}", `<@${customer}>`).replace("{image}", image).replace("{invite}", invite);
                        message.author.send(deliverMessage).then(() => {
                            message.author.send(guildInvite).then(() => {
                                sql = `DELETE FROM orders WHERE order_id = '${id}'`;
                                con.query(sql, function(err, result) {
                                    if (err) throw err;
                                    sql = `INSERT INTO sent_orders(order_id, deliverer, customer, image, guild_id, invite, message) VALUES('${id}', '${message.author.id}', '${customer.id}', '${image}', '${orderResult[0].guild_id}', '${guildInvite}', '${deliverMessage}')`;
                                    con.query(sql, function(err, result) {
                                        if (err) throw err;
                                        con.end();
                                        const confirmation = new MessageEmbed()
                                            .setTitle(`Confirmation`)
                                            .setColor(blue)
                                            .setDescription(`Your order is now being delivered by <@${message.author.id}>`);

                                        orderer.send(confirmation);
                                    });
                                });
                            });
                        });
                        return;
                    }
                    let chef = message.guild.members.cache.get(orderResult[0].cook_id);
                    let guild = client.guilds.cache.get(orderResult[0].guild_id);
                    let customer = guild.members.cache.get(orderResult[0].user_id);
                    let image = orderResult[0].image_url;
                    let guildInvite = `Don't send this link to the orderer!\nhttps://discord.gg/${orderResult[0].guild_invite}`;
                    let invite = `AW7z9qu`;
                    let deliverMessage = deliverResult[0].delivery_message.replace("{chef}", chef.displayName).replace("{customer}", customer.displayName).replace("{image}", image).replace("{invite}", invite);
                    message.author.send(deliverMessage).then(() => {
                        message.author.send(guildInvite).then(() => {
                            guildInvite = guildInvite.replace("Don't send this link to the orderer!\n", "");
                            sql = `DELETE FROM orders WHERE order_id = '${id}'`;
                            con.query(sql, function(err, result) {
                                if (err) throw err;
                                sql = `INSERT INTO sent_orders(order_id, chef, deliverer, customer, image, guild_id, invite, message) VALUES('${id}', '${chef.id}', '${message.author.id}', '${customer.id}', '${image}', '${orderResult[0].guild_id}', '${guildInvite}', ?)`;
                                con.execute(sql, [`${deliverMessage}`], function(err, result) {
                                    if (err) throw err;
                                    con.end();
                                    const confirmation = new MessageEmbed()
                                        .setTitle(`Confirmation`)
                                        .setColor(blue)
                                        .setDescription(`Your order is now being delivered by <@${message.author.id}>`);

                                    orderer.send(confirmation);
                                });
                            });
                        });
                    });
                });
            });
        });
    }
}