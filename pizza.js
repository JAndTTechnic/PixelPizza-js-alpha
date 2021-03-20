// node file system used to get files
const fs = require('fs');
// node mysql package for mysql databases
const mysql = require("mysql");
// all needed classes from discord.js (if you need more add them)
const { Client, Collection, MessageEmbed, WebhookClient } = require('discord.js');
// the prefix of my bot, the token of my bot and some other stuff (look in config.json for everything)
const { prefix, token, orderRoles, pizzaGuild, directorRoles, teacherRoles, channels, emojis, pizzadevrole } = require('./config.json');
// some color hex codes so you don't have to type them
const {red, blue, green, black} = require('./colors.json');
// a client for the bot
const client = new Client();
// all of my commands
client.commands = new Collection();
// all functions
client.functions = new Collection();
// all levels of users in Pixel Pizza
client.levels = new Collection();
// the cooldowns for everyone that uses commands
const cooldowns = new Collection();
// getting the files in the commands folder that end with .js
const cmdFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
// getting the files in the functions folder that end with .js
const funcFiles = fs.readdirSync('./functions').filter(file => file.endsWith('.js'));
// making an array with all activity types
const activities = ["PLAYING", "STREAMING", "LISTENING", "WATCHING"];

let allMembersChannel, botsChannel, membersChannel;

// database login
var db_config = {
    host: '37.59.55.185',
    user: 'Krgdge3bYm',
    password: 'T2nJhZlSAM',
    database: 'Krgdge3bYm'
};

// adding all commands to client.commands
for (let file of cmdFiles) {
    const command = require('./commands/' + file);
    client.commands.set(command.name, command);
}

for (let file of funcFiles) {
    const func = require('./functions/' + file);
    client.functions.set(file.replace(".js", ""), func);
}

function updateMemberSize(){
    // check member amount
    const guild = client.guilds.cache.get(pizzaGuild);
    allMembersChannel = client.channels.cache.get(channels.members.all);
    membersChannel = client.channels.cache.get(channels.members.members);
    botsChannel = client.channels.cache.get(channels.members.bots);
    const memberSize = guild.members.cache.filter(member => !member.user.bot).size;
    const botSize = guild.members.cache.filter(member => member.user.bot).size;
    allMembersChannel.setName(`All Members: ${guild.memberCount}`);
    membersChannel.setName(`Members: ${memberSize}`);
    botsChannel.setName(`Bots: ${botSize}`);
}

// if the bot is started
client.once('ready', () => {
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
            } else {                                        // connnection idle timeout (the wait_timeout
                throw err;                                  // server variable configures this)
            }
        });
    }

    handleDisconnect();

    let sql;

    const guild = client.guilds.cache.get(pizzaGuild);
    guild.members.cache.each(member => {
        if (member.user.bot) return;
        sql = `SELECT * FROM levels WHERE user_id = '${member.user.id}'`;
        con.query(sql, function(err, result) {
            if (err) throw err;
            if (result.length) return;
            sql = `INSERT INTO levels(username, user_id) VALUES('${member.user.username}', '${member.user.id}')`;
            con.query(sql, function(err) {
                if (err) {
                    if (err.errno == 1366) {
                        sql = `INSERT INTO levels(username, user_id) VALUES('invalid username', '${member.user.id}')`;
                        con.query(sql, function(err) {
                            if (err) {
                                throw err;
                            }
                        });
                    } else {
                        throw err;
                    }
                }
            });
        });
        sql = `SELECT * FROM economy WHERE user_id = '${member.user.id}'`;
        con.query(sql, function(err, result) {
            if (err) throw err;
            if (result.length) return;
            sql = `INSERT INTO economy(username, user_id) VALUES('${member.user.username}', '${member.user.id}')`;
            con.query(sql, function(err) {
                if (err) {
                    if (err.errno == 1366){
                        sql = `INSERT INTO economy(username, user_id) VALUES('invalid username', '${member.user.id}')`;
                        con.query(sql, function(err) {
                            if (err) throw err;
                        });
                    } else {
                        throw err;
                    }
                }
            });
        });
    });

    sql = `UPDATE orders SET status = 'cooked' WHERE status = 'cooking'`;
    con.query(sql, function(err){
        if (err) throw err;
    });

    con.end();

    const activity = activities[Math.floor(Math.random() * activities.length)];
    // get the current amount of guilds the bot is in
    let serverAmout = client.guilds.cache.array().length;
    // if serveramount is more than 999 it will have a k after it to shorten the number
    if (serverAmout > 1000) {
        serverAmout = `${serverAmout / 1000}k`;
    }
    switch(activity){
        case "PLAYING": 
            serverAmout = `with ${serverAmout}`;
            break;
        case "STREAMING":
            serverAmout = `to ${serverAmout}`;
            break;
        case "LISTENING":
            serverAmout = `at ${serverAmout}`;
            break;
    }
    // set activity for the bot with the server amount
    client.user.setActivity(`${serverAmout} guilds | ${prefix}help`, {type: activity})
    updateMemberSize();
    // log that the application has started up in the console
    console.log('Ready for pizza!');
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

client.on('error', error => {
    console.error('The websocket connection encountered an error:', error);
});

// happens when the bot is added to a new guild
client.on("guildCreate", guild => {
    const activity = activities[Math.floor(Math.random() * activities.length)];
    // making an embedded message for the webhook to send
    const embedMsgWebhook = new MessageEmbed()
        .setColor(green)
        .setTitle("Added")
        .setDescription(`${client.user.username} has been added to the guild ${guild.name}`)
        .setTimestamp()
        .setFooter(guild.id);

    // get the Pixel Pizza guild using the id that is in the variable pizzaGuild
    let ppGuild = client.guilds.cache.get(pizzaGuild);

    // get all webhooks in the Pixel Pizza guild
    ppGuild.fetchWebhooks().then(webhooks => {
        // getting one of the webhooks that are in the #logs channel
        let webhook = webhooks.find(webhook => webhook.channelID === channels.logs);
        // making a new webhook client using the found webhook
        let logsWebhookClient = new WebhookClient(webhook.id, webhook.token);
        // change the name and profile picture of the webhook
        logsWebhookClient.edit({
            // name of the guild
            name: guild.name,
            // icon of the guild
            avatar: guild.iconURL(),
        }).then(webhook => {
            // send embedded message to the logs channel
            webhook.send(embedMsgWebhook);
        });
    });

    // get the current amount of guilds the bot is in
    let serverAmout = client.guilds.cache.array().length;
    // if serveramount is more than 999 it will have a k after it to shorten the number
    if (serverAmout > 1000) {
        serverAmout = `${serverAmout / 1000}k`;
    }
    switch(activity){
        case "PLAYING": 
            serverAmout = `with ${serverAmout}`;
            break;
        case "STREAMING":
            serverAmout = `to ${serverAmout}`;
            break;
        case "LISTENING":
            serverAmout = `at ${serverAmout}`;
            break;
    }
    // change activity of the bot using the server amount
    client.user.setActivity(`${serverAmout} guilds | ${prefix}help`, {type: "WATCHING"});

    // making a thank you message
    const embedMsg = new MessageEmbed()
        .setColor(green)
        .setTitle("Thank you!")
        .setDescription(`Thank you for adding me!\nMy prefix is ${prefix}\nUse ${prefix}help for all commands!`);

    // getting the main channel of the guild
    let channel = guild.systemChannel;
    // if there is no main channel
    if (!channel){
        // find a text channel in the guild
        channel = guild.channels.cache.find(channel => channel.type === "text");
    }
    // send the thank you message to the channel
    channel.send(embedMsg);
});

// happens when the bot is deleted from a guild
client.on("guildDelete", guild => {
    const activity = activities[Math.floor(Math.random() * activities.length)];
    // making an embedded message for the webhook to send
    const embedMsgWebhook = new MessageEmbed()
        .setColor(red)
        .setTitle("Removed")
        .setDescription(`${client.user.username} has been removed from the guild ${guild.name}`)
        .setTimestamp();

    // get the Pixel Pizza guild using the id that is in the variable pizzaGuild
    let ppGuild = client.guilds.cache.get(pizzaGuild);

    // get all webhooks in the Pixel Pizza guild
    ppGuild.fetchWebhooks().then(webhooks => {
        // getting one of the webhooks that are in the #logs channel
        let webhook = webhooks.find(webhook => webhook.channelID === channels.logs);
        // making a new webhook client using the found webhook
        let logsWebhookClient = new WebhookClient(webhook.id, webhook.token);
        // change the name and profile picture of the webhook
        logsWebhookClient.edit({
            // name of the guild
            name: guild.name,
            // icon of the guild
            avatar: guild.iconURL(),
        }).then(webhook => {
            // send embedded message to the logs channel
            webhook.send(embedMsgWebhook);
        });
    });

    // get the current amount of guilds the bot is in
    let serverAmout = client.guilds.cache.array().length;
    // if serveramount is more than 999 it will have a k after it to shorten the number
    if (serverAmout > 1000) {
        serverAmout = `${serverAmout / 1000}k`;
    }
    // change activity of the bot using the server amount
    client.user.setActivity(`${serverAmout} guilds | ${prefix}help`, {type: "WATCHING"});
});

client.on('guildMemberAdd', member => {
    if (member.guild.id !== pizzaGuild) return;
    updateMemberSize();
    const guild = client.guilds.cache.get(pizzaGuild);
    guild.members.cache.each(member => {
        if (member.user.bot) return;
        sql = `SELECT * FROM levels WHERE user_id = '${member.user.id}'`;
        con.query(sql, function(err, result) {
            if (err) {
                throw err;
            }
            if (result.length) return;
            sql = `INSERT INTO levels(username, user_id) VALUES('${member.user.username}', '${member.user.id}')`;
            con.query(sql, function(err) {
                if (err) {
                    if (err.errno == 1366) {
                        sql = `INSERT INTO levels(username, user_id) VALUES('invalid username', '${member.user.id}')`;
                        con.query(sql, function(err) {
                            if (err) {
                                throw err;
                            }
                        });
                    } else {
                        throw err;
                    }
                }
            });
        });
        sql = `SELECT * FROM economy WHERE user_id = '${member.user.id}'`;
        con.query(sql, function(err, result) {
            if (err) {
                throw err;
            }
            if (result.length) return;
            sql = `INSERT INTO economy(username, user_id) VALUES('${member.user.username}', '${member.user.id}')`;
            con.query(sql, function(err) {
                if (err) {
                    if (err.errno == 1366) {
                        sql = `INSERT INTO economy(username, user_id) VALUES('invalid username', '${member.user.id}')`;
                        con.query(sql, function(err) {
                            if (err) {
                                throw err;
                            }
                        });
                    } else {
                        throw err;
                    }
                }
            });
        });
    });
});

client.on('guildMemberRemove', member => {
    if (member.guild.id !== pizzaGuild) return;
    updateMemberSize();
});

client.on('messageReactionAdd', async messageReaction => {
    if (messageReaction.message.guild.id !== pizzaGuild || messageReaction.emoji.id !== emojis.noice2) return;

    const guild = client.guilds.cache.get(pizzaGuild);
    const member = guild.members.cache.get(messageReaction.message.author.id);
    const channel = client.channels.cache.get(channels.noiceboard);
    const emoji = guild.emojis.cache.get(emojis.noice2);

    const embedMsg = new MessageEmbed()
        .setColor('#C01E1E')
        .setAuthor(member.displayName, messageReaction.message.author.displayAvatarURL())
        .setDescription(messageReaction.message.content)
        .addField("Message", `[Jump to message](${messageReaction.message.url})`)
        .setFooter(messageReaction.message.id)
        .setTimestamp();

    const message = channel.messages.cache.find(m => m.embeds[0].footer.text === messageReaction.message.id);

    if (messageReaction.count >= 3){
        const messageText = `${emoji} ${messageReaction.count} ${messageReaction.message.channel}`;
        if (!message){
            return channel.send(messageText, embedMsg);
        }
        message.edit(messageText, embedMsg);
    } else {
        if (!message) return;
        message.delete();
    }
});

client.on('messageReactionRemove', async messageReaction => {
    if (messageReaction.message.guild.id !== pizzaGuild || messageReaction.emoji.id !== emojis.noice2) return;

    const guild = client.guilds.cache.get(pizzaGuild);
    const member = guild.members.cache.get(messageReaction.message.author.id);
    const channel = client.channels.cache.get(channels.noiceboard);
    const emoji = guild.emojis.cache.get(emojis.noice2);

    const embedMsg = new MessageEmbed()
        .setColor('#C01E1E')
        .setAuthor(member.displayName, messageReaction.message.author.displayAvatarURL())
        .setDescription(messageReaction.message.content)
        .addField("Message", `[Jump to message](${messageReaction.message.url})`)
        .setFooter(messageReaction.message.id)
        .setTimestamp();

    const message = channel.messages.cache.find(m => m.embeds[0].footer.text === messageReaction.message.id);

    if (messageReaction.count >= 3){
        const messageText = `${emoji} ${messageReaction.count} ${messageReaction.message.channel}`;
        if (!message){
            return channel.send(messageText, embedMsg);
        }
        message.edit(messageText, embedMsg);
    } else {
        if (!message) return;
        message.delete();
    }
});

// happens when a message has been added in a channel that the bot is in
client.on('message', async message => {
    if (message.channel.id === channels.logs && !message.webhookID){
        message.delete();
    }
    if (message.channel.id === channels.updates && message.member){
        if (!message.member.roles.cache.get(message.guild.roles.get(pizzadevrole))){
            message.delete();
        }
    }
    if (message.guild){
        if (message.guild.id == pizzaGuild){
            await client.functions.get("addexp").addExp(1, message.author.id);
            setTimeout(async function() {
                await client.functions.get("checklevelroles").checkLevelRoles(message.author.id, client);
            }, 500);
        }
    }
    if (message.content.toLowerCase().includes('noice')) {
        var guild = client.guilds.cache.get(pizzaGuild);
        message.react(guild.emojis.cache.get(emojis.noice))
        .then(console.log)
        .catch(console.error);
    }
    // stops the function if the message does not start with the prefix in config.json or the author is a bot or a webhook
    if (!message.content.toLowerCase().startsWith(prefix) || message.author.bot || message.webhookID) return;
    
    if (message.guild){
        const clientMember = message.guild.members.cache.get(client.user.id);
        if (!clientMember.hasPermission("CREATE_INSTANT_INVITE")){
            const embedMsgError = new MessageEmbed()
                .setColor(red)
                .setTitle("Missing permission")
                .setDescription("I'm missing the `CREATE_INSTANT_INVITE` permission");

            return message.channel.send(embedMsgError);
        }
    }

    // removes the prefix from the message and splits the rest with every space
    // example
    // message = ppClaim aAd_4 it removes the prexix (pp)
    // Claim aAd_4 splits the message everywhere it find a space and makes a list out of it
    // args = [Claim, aAd_4] (list)
    const args = message.content.slice(prefix.length).split(/ +/);

    // removes the first thing in the args list, makes it lowercase and puts it in commandName
    // example
    // args = [Claim, aAd_4] (list)
    // first thing in list is claim removes that from args
    // args = [aAd_4] (list)
    // makes the string it removed lowercase
    // Claim = claim
    // puts it in commandName
    // commandName = claim
    const commandName = args.shift().toLowerCase();

    // puts commandName in the console
    // in the case of the example it puts claim in the console
    console.log(commandName);

    // searches for that command in client commands and the aliases of those commands and get the first thing it finds
    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    // stops the function if it finds nothing
    if (!command) return;

    // makes a standard embedded message
    const embedMsg = new MessageEmbed()
        .setColor(blue)
        .setAuthor(message.author.username, message.author.displayAvatarURL())
        .setThumbnail(message.author.displayAvatarURL())
        .setTimestamp()
        .setFooter(client.user.username, client.user.displayAvatarURL());

    // just a variable called con with nothing in it
    var con;

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
    
    // making a query that finds everyone who is blacklisted with the same user_id as the message author
    let sql = `SELECT * FROM blacklisted WHERE discord_id = '${message.author.id}'`;
    // runs query
    con.query(sql, function(err, result) {
        // stops if it finds and error
        if (err) {
            throw err;
        }
        // stops function if user is blacklisted
        if (result.length) {
            // end connection to database
            con.end();
            return;
        }
        // end connection to database
        con.end();
        // stops function if you message the bot in dm and sends a message to you
        if (message.channel.type == "dm") {
            embedMsg
                .setColor(red)
                .setDescription("Our commands are unavailable in DMs");
    
            return message.channel.send(embedMsg);
        }

        const ppGuild = client.guilds.cache.get(pizzaGuild);
        const member = ppGuild.members.cache.get(message.author.id);
        
        // checks if you have any staff roles
        let anyRole = false;
        if (member){
            orderRoles.forEach(role => {
                if (member.roles.cache.get(role)){
                    anyRole = true;
                }
            });
        }
        
        // checks if you have a director role
        let directorRole = false;
        directorRoles.forEach(role => {
            if (message.member.roles.cache.get(role)){
                directorRole = true;
            }
        });

        // checks if you have a director / teacher role
        let teacherRole = false;
        teacherRoles.forEach(role => {
            if (message.member.roles.cache.get(role)){
                teacherRole = true;
            }
        });
        
        // send an error message if userlevel (in module.exports) of the command is 1 and your not staff
        if (command.userLevel == 1 && !anyRole) {
            embedMsg.setColor(red);
            if (message.guild.id !== pizzaGuild){
                embedMsg.setDescription("This command can only be used in Pixel Pizza!");
            } else {
                embedMsg.setDescription("You need to be Pixel Pizza staff to use this command!");
            }
            return message.channel.send(embedMsg);
        }

        // send an error message if userlevel (in module.exports) of the command is 2 and your not teacher / director
        if (command.userLevel == 2 && !teacherRole){
            embedMsg.setColor(red);
            if (message.guild.id !== pizzaGuild){
                embedMsg.setDescription("This command can only be used in Pixel Pizza!");
            } else {
                embedMsg.setDescription("You need to be Pixel Pizza director or teacher to use this command!");
            }
            return message.channel.send(embedMsg);
        }
        
        // send an error message if userlevel (in module.exports) of the command is 3 and your not director
        if (command.userLevel == 3 && !directorRole){
            embedMsg.setColor(red);
            if (message.guild.id !== pizzaGuild){
                embedMsg.setDescription("This command can only be used in Pixel Pizza!");
            } else {
                embedMsg.setDescription("You need to be Pixel Pizza director to use this command!");
            }
            return message.channel.send(embedMsg);
        }
        
        // checks if command requires arguments and if it needs it and does not get it sends an error message
        if (command.args && !args.length) {
            let reply = `There were no arguments given,  ${message.author}`;
    
            if (command.usage) {
                reply += `\nThe proper usage is: '${prefix}${command.name} ${command.usage}'`;
            }
    
            embedMsg
                .setColor(red)
                .setTitle('**No arguments**')
                .setDescription(reply);
            return message.channel.send(embedMsg);
        }

        // if the command does not require arguments but there still are sends an error message
        if (command.args == false && args.length){
            let reply = `This command doesn't require any arguments, ${message.author}`;

            embedMsg
                .setColor(red)
                .setTitle('**No arguments needed**')
                .setDescription(reply)
            return message.channel.send(embedMsg);
        }

        // sends an error message if the arguments are more than needed
        if (command.minArgs && args.length < command.minArgs){
            embedMsg
                .setColor(red)
                .setDescription(`${prefix}${command.name} takes a minimum of ${command.minArgs} argument(s)! The proper usage is ${prefix}${command.name} ${command.usage}`);
            return message.channel.send(embedMsg);
        }

        // sends an error message if the arguments are less than needed
        if (command.maxArgs && args.length > command.maxArgs){
            embedMsg
                .setColor(red)
                .setDescription(`${prefix}${command.name} takes a maximum of ${command.maxArgs} argument(s)! The proper usage is ${prefix}${command.name} ${command.usage}`);
            return message.channel.send(embedMsg);
        }
        
        // if the command doesn't have any cooldowns yet makes it
        if (!cooldowns.has(command.name)) {
            cooldowns.set(command.name, new Collection());
        }
        
        // checks current date
        const now = Date.now();
        // gets all cooldowns of a command
        const timestamps = cooldowns.get(command.name);
        // gets the cooldown times 1000 (from module.exports) and if it's not there makes it 0 
        let cooldownAmount = (command.cooldown || 0) * 1000;
        
        // checks if the user has a cooldown
        if (timestamps.has(message.author.id)) {
            // checks when the cooldown is done
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
            
            // sends an error if you still have a cooldown
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                embedMsg.setColor(black).setTitle('**Cooldown**').setDescription(`please wait ${timeLeft} more second(s) before reusing ${command.name}`);
                return message.channel.send(embedMsg);
            }
        }
        
        // sets a new cooldown
        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
        
        setTimeout(function() {
            try {
                // executes the execute function of the command
                command.execute(message, args, client);
                // logs if the command has been executed in the console
                console.log(`${command.name} executed!`);
            } catch (error) {
                // sends error to the console if there is one
                console.error(error);
                // make an error message
                embedMsg
                    .setColor(red)
                    .setTitle('**Error**')
                    .setDescription('there was an error trying to execute that command!');
    
                // send error message
                message.channel.send(embedMsg);
            }
        }, 500);
    });
});

// login to the bots account
client.login(token);
