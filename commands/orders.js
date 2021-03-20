const { MessageEmbed } = require('discord.js');
const mysql = require("mysql2");
const {blue} = require('../colors.json');

module.exports = {
    name: "orders",
    description: "see the list of orders",
    args: false,
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

        let sql = "SELECT order_id FROM orders";
        con.query(sql, function(err, result) {
            let orders = [];
            
            for (let i = 0; i < result.length; i++){
                orders.push(result[i].order_id);
            }

            const embedMsg = new MessageEmbed()
                .setColor(blue)
                .setTitle("Orders")
                .setDescription(`\`\`${orders.join(", ")}\`\``);
            
            if (!orders.length){
                embedMsg.setDescription(`There are currently no orders!`);
            }
            message.channel.send(embedMsg);
        });
        con.end();
    }
}