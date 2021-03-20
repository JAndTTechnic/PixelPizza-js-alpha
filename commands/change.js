const {MessageEmbed} = require('discord.js');
const mysql = require("mysql2");
const http = require('http');
const https = require("https");
const {URL} = require("url");
const needle = require("needle");
const {channels, pizzaGuild} = require('../config.json');
const {blue, red} = require('../colors.json');

module.exports = {
    name: "change",
    description: "change an image from an order",
    args: true,
    minArgs: 1,
    maxArgs: 2,
    usage: "<order id> <image attachment>",
    userLevel: 1, // 0: everyone, 1: only pixel pizza staff, 2: directors and teachers, 3: only pixel pizza directors
    execute(message, args, client){
        let id;
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
            .setTitle("Change image")
            .setColor(blue);

        const ppGuild = client.guilds.cache.get(pizzaGuild);
        const member = ppGuild.members.cache.get(message.author.id);
        const cook_role = ppGuild.roles.cache.get("709745724052734015");

        if (!member.roles.cache.get("709745724052734015")){
            embedMsg
                .setColor(red)
                .setDescription(`You need to have the role \`${cook_role.name}\` in Pixel Pizza to be able to cook an order!`);
            
            con.end();
            return message.channel.send(embedMsg);
        }

        if (!message.attachments.first()){
            embedMsg
                .setColor(red)
                .setDescription(`You can only use files as images!`);

            con.end();
            return message.channel.send(embedMsg);
        }

        if (message.attachments.array().length > 1){
            embedMsg
                .setColor(red)
                .setDescription(`There are too many attachments! please send only one image with the message!`);

            con.end();
            return message.channel.send(embedMsg);
        }

        id = args[0];

        let sql = `SELECT cook_id, image_url, status FROM orders WHERE order_id = '${id}'`;
        con.query(sql, function(err, result){
            if (err) throw err;
            if (!result.length){
                embedMsg
                    .setColor(red)
                    .setDescription(`The order with order id '${id}' doesn't exist!`);

                con.end();
                return message.channel.send(embedMsg);
            }
            if (!result[0].cook_id){
                embedMsg
                    .setColor(red)
                    .setDescription(`This order has not been claimed yet, you can only change the image if you cook it first!`);
                
                con.end();
                return message.channel.send(embedMsg);
            }
            if (!result[0].image_url){
                embedMsg
                    .setColor(red)
                    .setDescription(`This order has not been cooked yet! it needs to be cooked before an image can be changed!`);

                con.end();
                return message.channel.send(embedMsg);
            }
            if (result[0].cook_id != message.author.id){
                embedMsg
                    .setColor(red)
                    .setDescription(`You need to be the cook who claimed the order to change the image!`);
                
                con.end();
                return message.channel.send(embedMsg);
            }
            const url = message.attachments.first().url;
            const uri = new URL(url);
            const protocol = uri.protocol;
            let proto = http;
            if (protocol === "https:"){
                proto = https;
            }
            proto.get(uri, response => {
                const chunks = [];
                response.on("data",chunk=>{
                    chunks.push(chunk);
                });
                response.on("end", () => {
                    const file = Buffer.concat(chunks).toString('base64');
                    let extension = "null";
                    if (url.endsWith("png")){
                        extension = "png";
                    } else if (url.endsWith("jpg") || url.endsWith("jpeg")){
                        extension = "jpg";
                    } else if (url.endsWith("gif")){
                        extension = "gif";
                    }
                    needle.post("https://images-pixelpizza.000webhostapp.com/index.php", {image: file, extension: extension}, function(err, res, body){
                        if (err) throw err;
                        const divPos = body.search("id='imagepath'") + 15;
                        if (extension == "null"){
                            extension = "png";
                        }
                        const fileName = `${body.substring(divPos, divPos + 23)}.${extension}`;
                        const imageUrl = `https://images-pixelpizza.000webhostapp.com/${fileName}`;
                        sql = `UPDATE orders SET image_url = '${imageUrl}' WHERE order_id = '${id}'`;
                        con.query(sql, function(err, result){
                            if (err) throw err;
                            embedMsg.setDescription(`The image for order '${id}' has been updated`);
                            con.end();
                            message.channel.send(embedMsg);
                        });
                    });
                });
            });
        });
    }
}