const {MessageEmbed} = require('discord.js');
const mysql = require('mysql2');
const {prefix} = require('../config.json');
const {blue, red} = require('../colors.json');

module.exports = {
    name: "cancel",
    description: "cancel your own order",
    args: false,
    userLevel: 0,
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

        const embedMsg = new MessageEmbed()
            .setColor(red)
            .setTitle("**No Order**")
            .setDescription(`You have not ordered anything use ${prefix}order to order a pizza`);

        let sql = `SELECT * FROM orders WHERE user_id = '${message.author.id}'`;
        con.query(sql, function(err, result) {
            if (err) throw err;
            if (!result.length){
                con.end();
                return message.channel.send(embedMsg);
            }
            embedMsg
                .setColor(blue)
                .setTitle("Cancel Order")
                .setDescription("Your order has been canceled!");

            sql = `DELETE FROM orders WHERE user_id = '${message.author.id}'`;
            con.query(sql, function(err) {
                if (err) throw err;
                message.channel.send(embedMsg);
                con.end();
            });
        });
    }
}