const { MessageEmbed } = require('discord.js');
const mysql = require("mysql2");
const {blue, red} = require('../colors.json');
const {channels, pizzaGuild, levelroles} = require('../config.json');

module.exports = {
    name: "order",
    description: "order a pizza",
    args: true,
    minArgs: 1,
    usage: "<pizza name>",
    userLevel: 0, // 0: everyone, 1: only pixel pizza staff, 2: directors and teachers, 3: only pixel pizza directors
    async execute(message, args, client){
        const maxPizzas = 20;

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
            .setTitle("Order")
            .setDescription("Your pizza has been ordered and will be cooked as soon as possible!");

        const embedMsgOrder = new MessageEmbed()
            .setColor(blue);
        
        let sql = `SELECT COUNT(*) as counted FROM orders`;
        con.query(sql, function(err, result) {
            if (err) throw err;
            const guild = client.guilds.cache.get(pizzaGuild);
            const member = guild.members.cache.get(message.author.id);
            if (result[0].counted >= maxPizzas && !member.roles.cache.get(levelroles.hunderedvip)){
                embedMsgOrder
                    .setColor(red)
                    .setDescription(`The maximum pizza amount has been reached! please try again later`);
                
                con.end();
                reachedMaxPizzas = true;
                message.channel.send(embedMsgOrder);
                return;
            }
            const order = args.join(" ");
            const orderer = message.author.tag;
            const guildName = message.guild.name;

            const orderChannel = client.channels.cache.get(channels.order);

            if (message.guild.id === pizzaGuild){
                if (!channels.ordering.includes(message.channel.id)){
                    let reply = "Please order in ";
                    channels.ordering.forEach(channel => {
                        reply += `<#${channel}> or `;
                    });
                    reply = reply.substring(0, reply.length - 4);
                    embedMsg.setColor(red).setDescription(reply);
                    con.end();
                    return message.channel.send(embedMsg);
                }
            }

            if (!order.toLowerCase().includes("pizza")){
                embedMsg.setTitle(`error`).setColor(red).setDescription("The order has to include the word pizza!");
                return message.channel.send(embedMsg);
            }

            let id = "";

            const base64 = [
                'a', 'b', 'c', 'd',
                'e', 'f', 'g', 'h',
                'i', 'j', 'k', 'l',
                'm', 'n', 'o', 'p',
                'q', 'r', 's', 't',
                'u', 'v', 'w', 'x',
                'y', 'z', 'A', 'B',
                'C', 'D', 'E', 'F',
                'G', 'H', 'I', 'J',
                'K', 'L', 'M', 'N',
                'O', 'P', 'Q', 'R',
                'S', 'T', 'U', 'V',
                'W', 'X', 'Y', 'Z',
                '1', '2', '3', '4',
                '5', '6', '7', '8',
                '9', '0', '-', '_'
            ];

            function makeId(){
                id = "";
                for (var i = 0; i < 5; i++){
                    id += base64[Math.floor(Math.random() * base64.length)];
                }
                sql = "SELECT order_id FROM orders";
                con.query(sql, function(err, result) {
                    let orders = [];
                    
                    for (let i = 0; i < result.length; i++){
                        orders.push(result[i].order_id);
                    }

                    if (orders.includes(id)){
                        makeId();
                    }
                });
            }

            makeId();

            message.channel.createInvite({ maxAge: 0, maxUses: 0 }).then(invite => {
                let sql = `INSERT INTO orders(order_id, \`order\`, user_id, guild_id, channel_id, guild_invite, status) VALUES('${id}', ?, '${message.author.id}', '${message.guild.id}', '${message.channel.id}', '${invite.code}', 'not claimed')`;
                con.execute(sql, [`${order}`], function(err, result){
                    if (err) {
                        if (err.code == 'ER_DUP_ENTRY' && err.sqlMessage.endsWith("'user_id_UNIQUE'")){
                            embedMsg.setColor(red).setDescription(`You have already ordered pizza. please wait until your order has arrived`);
                            con.end();
                            return message.channel.send(embedMsg);
                        } else {
                            throw err;
                        }
                    }
                    embedMsgOrder
                        .setTitle("**Order**")
                        .setDescription(`a new order has come in!`)
                        .setTimestamp()
                        .setFooter(`id: ${id}`);
                    
                    orderChannel.send(embedMsgOrder);
                    message.channel.send(embedMsg);
                    con.end();
                });
            });
        });
    }
}