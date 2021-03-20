// gets the MessageEmbed class from discord.js
const {MessageEmbed} = require('discord.js');
// gets mysql
const mysql = require("mysql2");
// gets the hex values of blue and red
const {blue, red} = require('../colors.json');

module.exports = {
    // name of the command
    name: "add",
    // a brief description of the command
    description: "add someone as cook or deliverer",
    // does the command need arguments? (don't add if there are only optional arguments)
    args: true,
    // what arguments does the command need <> = required, [] = optional, | = or
    usage: "<cook | deliverer> <user mention | user id>",
    // the minimum of arguments the command needs
    minArgs: 2,
    // the maximum of arguments the command needs
    maxArgs: 2,
    // 0: everyone, 1: only pixel pizza staff, 2: directors and teachers, 3: only pixel pizza directors
    userLevel: 2,
    // execute function
    execute(message, args, client){
        // make a new embedded message
        const embedMsg = new MessageEmbed()
            .setTitle("Add worker")
            .setColor(blue);
        
        // a list of the kinds of workers you can add
        const workers = [
            "cook",
            "chef",
            "deliverer",
            "deliver"
        ];

        // check if the first argument is in the list of worker types and sends error
        if (!workers.includes(args[0])){
            embedMsg
                .setColor(red)
                .setDescription(`Please choose one of these\n\`\`\`${workers.join("\n")}\`\`\`\n(if the right role is not in here just give the person the role)`);
            
            return message.channel.send(embedMsg);
        }

        // changes chef to cook and deliver to deliverer
        switch(args[0]){
            case "chef":
                args[0] = "cook";
                break;
            case "deliver":
                args[0] = "deliverer";
                break;
        }

        // get the user mention
        let user = message.mentions.users.first();
        // if there are no user mention checks if there is a user id
        if (!user){
            // gets userid
            user = client.users.cache.get(args[1]);
            if (!user){
                user = client.users.cache.find(user => user.username.toLowerCase().includes(args[1].toLowerCase()));
                if (!user){
                    embedMsg.setColor(red).setDescription(`Could not find that user`);
                    return message.channel.send(embedMsg);
                }
            }
        }

        // just a variable called con with nothing in it
        var con;

        // database login
        var db_config = {
            host: '37.59.55.185',
            user: 'Krgdge3bYm',
            password: 'T2nJhZlSAM',
            database: 'Krgdge3bYm'
        };

        // reconnects if disconnected because of a connection loss
        function handleDisconnect() {
            // creates a new connection
            con = mysql.createConnection(db_config); // Recreate the connection, since
            // the old one cannot be reused.

            // reconnects
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

        // connect first time
        handleDisconnect();

        // make a sql variable
        let sql;
        // make a member variable
        let member;
        // checks what the first argument is
        switch(args[0]){
            // if the first argument is cook
            case "cook":
                // selects all cooks with the same user_id as the user that has been mentioned
                sql = `SELECT * FROM cooks WHERE cook_discord_id = '${user.id}'`;
                // runs query
                con.query(sql, function(err, result) {
                    // stops if finds error
                    if (err) throw err;
                    // stops the function if the user is already a cook and sends it to the channel
                    if (result.length){
                        embedMsg.setColor(red).setDescription(`This user is already a cook!`);
                        con.end();
                        return message.channel.send(embedMsg);
                    }
                    // makes a query that adds the cook to the database
                    sql = `INSERT INTO cooks(cook_discord_id, cook_name) VALUES('${user.id}', '${user.username}')`;
                    // runs query
                    con.query(sql, function(err, result){
                        // stops if finds error
                        if (err) throw err;
                        // gets the member
                        member = message.guild.members.cache.get(user.id);
                        // gets the role @cook
                        let cookRole = message.guild.roles.cache.get("709745724052734015");
                        // gives the member the role @cook
                        member.roles.add(cookRole);
                        // ends database connection
                        con.end();
                        // sends a message that the user has been added
                        embedMsg.setDescription(`${user} has been added as cook!`);
                        message.channel.send(embedMsg);
                    });
                });
                break;
            // if the first argument is deliverer
            case "deliverer":
                // selects all deliverers with the same user_id as the user that has been mentioned
                sql = `SELECT * FROM deliverers WHERE deliverer_discord_id = '${user.id}'`;
                // runs query
                con.query(sql, function(err, result) {
                    // stops if finds error
                    if (err) throw err;
                    // stops the function if the user is already a deliverer and sends it to the channel
                    if (result.length){
                        embedMsg.setColor(red).setDescription(`This user is already a deliverer!`);
                        con.end();
                        return message.channel.send(embedMsg);
                    }
                    // makes a query that adds the deliverer to the database
                    sql = `INSERT INTO deliverers(deliverer_discord_id, deliverer_name) VALUES('${user.id}', '${user.username}')`;
                    // runs query
                    con.query(sql, function(err, result){
                        // stops if finds error
                        if (err) throw err;
                        // gets the member
                        member = message.guild.members.cache.get(user.id);
                        // gets the role @deliverer
                        let deliverRole = message.guild.roles.cache.get("709829482155868221");
                        // gives the member the role @deliverer
                        member.roles.add(deliverRole);
                        // ends database connection
                        con.end();
                        // sends a message that the user has been added
                        embedMsg.setDescription(`${user} has been added as deliverer!`);
                        message.channel.send(embedMsg);
                    });
                });
                break;
        }
    }
}