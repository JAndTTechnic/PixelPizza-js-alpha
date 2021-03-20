const {MessageEmbed} = require('discord.js');
const mysql = require("mysql2");
const http = require('http');
const https = require("https");
const {URL} = require("url");
const request = require('request');
var {isUri} = require('valid-url');
const needle = require("needle");
const {channels, pizzaGuild} = require('../config.json');
const {blue, red} = require('../colors.json');

module.exports = {
    name: "cook",
    description: "cook a pizza",
    args: true,
    minArgs: 1,
    maxArgs: 2,
    usage: "<order id> <image attachment | url>",
    userLevel: 1,  //0: everyone, 1: only pixel pizza staff, 2: directors and teachers, 3: only pixel pizza directors
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
            con = mysql.createConnection(db_config);  //Recreate the connection, since
             //the old one cannot be reused.

            con.connect(function (err) {               //The server is either down
                if (err) {                                      //or restarting (takes a while sometimes).
                    console.log('error when connecting to db:', err);
                    setTimeout(handleDisconnect, 2000);  //We introduce a delay before attempting to reconnect,
                }                                      //to avoid a hot loop, and to allow our node script to
            });                                      //process asynchronous requests in the meantime.
             //If you're also serving http, display a 503 error.
            con.on('error', function (err) {
                console.log('db error', err);
                if (err.code === 'PROTOCOL_CONNECTION_LOST') {  //Connection to the MySQL server is usually
                    handleDisconnect();                          //lost due to either server restart, or a
                } else {                                       //connnection idle timeout (the wait_timeout
                    throw err;                                   //server variable configures this)
                }
            });
        }

        handleDisconnect();

        const embedMsg = new MessageEmbed()
            .setTitle("Cook")
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

        if (message.attachments.array().length > 1){
            embedMsg
                .setColor(red)
                .setDescription(`There are too many attachments! please send only one image with the message!`);

            con.end();
            return message.channel.send(embedMsg);
        }

        id = args[0];

        let sql = `SELECT cook_id, user_id, image_url, status FROM orders WHERE order_id = '${id}'`;
        con.query(sql, function(err, orderResult){
            if (err) throw err;
            if (!orderResult.length){
                embedMsg
                    .setColor(red)
                    .setDescription(`The order with order id '${id}' doesn't exist!`);

                con.end();
                return message.channel.send(embedMsg);
            }
            if (!orderResult[0].cook_id){
                embedMsg
                    .setColor(red)
                    .setDescription(`This order has not been claimed yet, if you want to cook it please claim it first!`);
                
                con.end();
                return message.channel.send(embedMsg);
            }
            if (orderResult[0].image_url){
                embedMsg.setColor(red);
                if (orderResult[0].status == 'cooked'){
                    embedMsg.setDescription(`This order has already been cooked!`);
                } else if (orderResult[0].status == 'cooking'){
                    embedMsg.setDescription(`This order is cooking!`);
                }

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
            if (orderResult[0].cook_id != message.author.id){
                embedMsg
                    .setColor(red)
                    .setDescription(`This order has already been claimed by someone else!`);
                
                con.end();
                return message.channel.send(embedMsg);
            }
            let url;
            if (message.attachments.first()){
                url = message.attachments.first().url;
            } else {
                url = args[1];
            }
            if (!isUri(url)){
                embedMsg
                    .setColor(red)
                    .setDescription(`This URL is invalid!`);

                return message.channel.send(embedMsg);
            }
            request(url, (error, response, body) => {
                if (error || response.statusCode != 200){
                    embedMsg
                        .setColor(red)
                        .setDescription(`The website is not responding!`);

                    return message.channel.send(embedMsg);
                }
                if(((response.headers['content-type']).match(/(image)+\//g)).length == 0){
                    embedMsg
                        .setColor(red)
                        .setDescription(`This URL is not an image!`);

                    return message.channel.send(embedMsg);
                }
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
                            sql = `UPDATE orders SET image_url = '${imageUrl}', status = 'cooking' WHERE order_id = '${id}'`;
                            con.query(sql, function(err, result) {
                                if (err) throw err;
                                var cookTime = Math.floor((Math.random() * 420) + 60);
                                var cookMinutes = Math.floor(cookTime / 60);
                                var cookSeconds = cookTime % 60;
                                embedMsg.setDescription(`The order is cooking for ${cookMinutes}m${cookSeconds}s!`);
                                let confirmation = new MessageEmbed()
                                    .setTitle(`Confirmation`)
                                    .setColor(blue)
                                    .setDescription(`Your order is now being cooked`);
                                    
                                orderer.send(confirmation);
                                setTimeout(function() {
                                    sql = `UPDATE orders SET status = 'cooked' WHERE order_id = '${id}'`;
                                    con.query(sql, function(err, result) {
                                        if (err) throw err;
                                        embedMsg.setDescription(`The order with order id '${id}' is done cooking!`);
                                        let deliverChannel = client.channels.cache.get(channels.deliver);
                                        deliverChannel.send(embedMsg);
                                        sql = `UPDATE cooks SET cooks = cooks + 1 WHERE cook_discord_id = '${message.author.id}'`;
                                        con.query(sql, function(err, result) {
                                            if (err) throw err;
                                            con.end();
                                            confirmation.setDescription(`Your order has been cooked`);
                                            orderer.send(confirmation);
                                        });
                                    });
                                }, cookTime * 1000);
                                return message.channel.send(embedMsg);
                            });
                        });
                    });
                });
            });
        });
    }
}