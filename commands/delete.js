const {MessageEmbed} = require('discord.js');
const mysql = require("mysql2");
const {blue, red} = require('../colors.json');

module.exports = {
    name: "delete",
    description: "delete a cook or deliverer",
    args: true,
    usage: "<cook | deliverer> <user mention | user id>",
    minArgs: 2,
    maxArgs: 2,
    userLevel: 3,
    execute(message, args, client){
        const embedMsg = new MessageEmbed()
            .setTitle("Delete worker")
            .setColor(blue);
        
        const workers = [
            "cook",
            "chef",
            "deliverer",
            "deliver"
        ];

        if (!workers.includes(args[0])){
            embedMsg
                .setColor(red)
                .setDescription(`Please choose one of these\n\`\`\`${workers.join("\n")}\`\`\`\n(if the right role is not in here just remove the role from the person)`);
            
            return message.channel.send(embedMsg);
        }

        switch(args[0]){
            case "chef":
                args[0] = "cook";
                break;
            case "deliver":
                args[0] = "deliverer";
                break;
        }

        let user = message.mentions.users.first();
        if (!user){
            let userId = args[1];
            embedMsg.setColor(red);
            if (isNaN(userId)){
                embedMsg.setDescription(`The user id should be a number!`);
                return message.channel.send(embedMsg);
            }

            if (userId.length != 18){
                embedMsg.setDescription(`A user id has 18 characters!`);
                return message.channel.send(embedMsg);
            }

            user = client.users.cache.get(userId);
            if (!user){
                embedMsg.setDescription(`This user id is invalid or the bot doesn't have any mutual servers`);
                return message.channel.send(embedMsg);
            }
            embedMsg.setColor(blue);
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

        let sql;
        let member;
        switch(args[0]){
            case "cook":
                sql = `SELECT * FROM cooks WHERE cook_discord_id = '${user.id}'`;
                con.query(sql, async function(err, result) {
                    if (err) throw err;
                    if (!result.length){
                        embedMsg.setColor(red).setDescription(`This user is not a cook!`);
                        con.end();
                        return message.channel.send(embedMsg);
                    }
                    sql = `SELECT * FROM orders WHERE cook_id = ${result[0].cook_id}`;
                    await con.query(sql, async function(err, result) {
                        if (err) throw err;
                        if (result.length){
                            result.foreach(async cookResult => {
                                if (cookResult.status == "claimed"){
                                    sql = `UPDATE orders SET status = 'not claimed', cook_id = ` + null + ` WHERE order_id = '${cookResult.order_id}'`;
                                    await con.query(sql, function(err, result) {
                                        if (err) throw err;
                                    });
                                } else if (cookResult.status == "cooking" || cookResult.status == "cooked" || cookResult.status == "delivering"){
                                    sql = `UPDATE orders SET cook_id = ` + null + ` WHERE order_id = '${cookResult.order_id}'`;
                                    await con.query(sql, function(err, result){
                                        if (err) throw err;
                                    });
                                }
                            });
                        }
                    });
                    sql = `DELETE FROM cooks WHERE cook_discord_id = '${user.id}'`;
                    con.query(sql, function(err, result){
                        if (err) throw err;
                        member = message.guild.members.cache.get(user.id);
                        let cookRole = message.guild.roles.cache.get("709745724052734015");
                        member.roles.remove(cookRole);
                        con.end();
                        embedMsg.setDescription(`${user} has been deleted from cooks!`);
                        message.channel.send(embedMsg);
                    });
                });
                break;
            case "deliverer":
                sql = `SELECT * FROM deliverers WHERE deliverer_discord_id = '${user.id}'`;
                con.query(sql, function(err, result) {
                    if (err) throw err;
                    if (!result.length){
                        embedMsg.setColor(red).setDescription(`This user is not a deliverer!`);
                        con.end();
                        return message.channel.send(embedMsg);
                    }
                    sql = `DELETE FROM deliverers WHERE deliverer_discord_id = '${user.id}'`;
                    con.query(sql, function(err, result){
                        if (err) throw err;
                        member = message.guild.members.cache.get(user.id);
                        let deliverRole = message.guild.roles.cache.get("709829482155868221");
                        member.roles.remove(deliverRole);
                        con.end();
                        embedMsg.setDescription(`${user} has been deleted from deliverers!`);
                        message.channel.send(embedMsg);
                    });
                });
                break;
        }
    }
}