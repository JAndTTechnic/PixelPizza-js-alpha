const {MessageEmbed} = require('discord.js');
const mysql = require("mysql2");
const {blue, red} = require('../colors.json');
const {rules} = require('../config.json');

module.exports = {
    name: "remove",
    description: "remove an order",
    aliases: ['rem', 'force'],
    args: true,
    minArgs: 1,
    maxArgs: 1,
    usage: "<order id>",
    userLevel: 1, // 0: everyone, 1: only pixel pizza staff, 2: directors and teachers, 3: only pixel pizza directors
    execute(message, args, client){
        const embedMsg = new MessageEmbed()
            .setColor(blue)
            .setTitle("Remove Order");

        const embedMsgDM = new MessageEmbed()
            .setColor(blue)
            .setTitle("order removed");

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

        let id = args[0];
        let sql = `SELECT * FROM orders WHERE order_id = '${id}'`;
        con.query(sql, function(err, result){
            if (err) throw err;
            if (!result.length){
                embedMsg
                    .setColor(red)
                    .setDescription(`The order with order id '${id}' doesn't exist!`);

                return message.channel.send(embedMsg);
            }
            embedMsg.setDescription(`What rule has been broken (please send the rule number)?\n\`\`\`\n${rules.join("\n")}\`\`\``);
            message.channel.send(embedMsg).then(msg => {
                let filter = m => {
                    if (m.content === "cancel") return true;
                    return m.author === message.author && !isNaN(m.content) && parseInt(m.content) <= rules.length;
                };
                const collector = message.channel.createMessageCollector(filter, {max: 1});
                collector.on('collect', m => {
                    if (m.content === "cancel"){
                        return;
                    }
                    sql = `DELETE FROM orders WHERE order_id = '${id}'`;
                    con.query(sql, function(err) {
                        if (err) throw err;
                        let user = client.users.cache.get(result[0].user_id);
                        sql = `INSERT INTO removed_orders VALUES('${id}', '${result[0].order}', '${user.id}', '${user.tag}', '${m.author.id}', '${m.author.tag}')`;
                        con.query(sql, function(err) {
                            if (err) throw err;
                            embedMsg.setDescription(`Order id '${id}' has been removed for violating rule ${m.content}`);
                            msg.edit(embedMsg);
                            embedMsgDM
                                .setDescription(`Your order has been removed for violation rule:\n${rules[parseInt(m.content) - 1]}\nif you think your order has not violated that rule please join our server and make a complaint in #complaints`)
                                .addField("Invite link", "https://discord.com/invite/AW7z9qu");

                            user.send(embedMsgDM);
                        });
                    });
                });
            });
        });
    }
}