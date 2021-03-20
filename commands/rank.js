const Discord = require('discord.js');
const Canvas = require('canvas');
const mysql = require('mysql');
const {red, black, levels} = require('../colors.json');
const {database, levelprops} = require('../config.json');

const dbconfig = {
    host: database.host,
    user: database.user,
    password: database.password,
    database: database.database
};

module.exports = {
    name: "rank",
    description: "show your rank in the leaderboard, level and exp",
    minArgs: 0,
    aliases: ["level"],
    userLevel: 0,
    async execute(message, args, client){
        const embedMsg = new Discord.MessageEmbed()
        .setColor(red)
        .setTitle("User not found")
        .setDescription(`Could not find user`);

        const con = mysql.createConnection(dbconfig);
        let user = message.author;
        if (args.length){
            if (message.mentions.users.first()){
                user = message.mentions.users.first();
            } else if (!isNaN(parseInt(args[0]))){
                user = client.users.cache.get(args[0]);
            } else {
                let username = args.toString().replace(",", " ");
                user = client.users.cache.find(user => user.username.toLowerCase().includes(username.toLowerCase()));
            }
            if (!user){
                return message.channel.send(embedMsg);
            }
        }

        const applyText = (canvas, text, size) => {
            const ctx = canvas.getContext("2d");

            let fontSize = 70;

            do {
                ctx.font = `${fontSize -= 10}px sans-serif`;
            } while (ctx.measureText(text).width > canvas.width - size);

            return ctx.font;
        };

        async function makeImg(level, exp, rank, style) {
            if (exp < 0) exp = 0;
            if (level < 0) level = 0;
            if (level > 100) level = 100;
            if (rank >= 100) rank = "99+";
            let neededExp = levelprops.baseexp * (level + 1) + levelprops.addexp * level;
            if (level == 100){
                neededExp = levelprops.baseexp * level + levelprops.addexp * (level - 1);
                exp = neededExp;
            }
            let ranktext = `#${rank}`;

            // back
            ctx.fillStyle = style.back;
            ctx.fillRect(0, 0, 700, 250);

            // front
            ctx.fillStyle = style.front;
            ctx.fillRect(15, 20, 670, 210);

            // username
            ctx.font = applyText(canvas, user.username, 480);
            ctx.fillStyle = black;
            ctx.fillText(user.username, canvas.width / 3 - 10, canvas.height / 1.6);

            // level number
            ctx.font = applyText(canvas, level.toString(), 500);
            let font = ctx.font.replace("px sans-serif", "");
            let pos = (canvas.width - (ctx.measureText(level.toString()).width + 20));
            ctx.fillText(level.toString(), pos, 75);

            // level text
            ctx.font = "30px sans-serif";
            pos = (pos - font - 8);
            font = 30;
            ctx.fillText("level", pos, 75);

            // rank number
            ctx.font = applyText(canvas, ranktext, 500);
            pos = (pos - ctx.measureText(ranktext).width - 5);
            font = ctx.font.replace("px sans-serif", "");
            ctx.fillText(ranktext, pos, 75);

            // rank text
            ctx.font = "30px sans-serif";
            pos = (pos - font - 5);
            font = 30;
            ctx.fillText("rank", pos, 75);

            // exp / neededExp text
            ctx.font = 30;
            const expText = `${exp.toString()} / ${neededExp.toString()} xp`;
            ctx.fillText(expText, (canvas.width - (ctx.measureText(expText).width + 20)) - 10, canvas.height / 1.6);

            // level bar - back
            ctx.fillStyle = style.exp_back;
            ctx.beginPath();
            ctx.arc(240, 190, 20, Math.PI * 1.5, Math.PI * 0.5, true);
            ctx.lineTo(650, 210);
            ctx.arc(650, 190, 20, Math.PI * 0.5, Math.PI * 1.5, true);
            ctx.closePath();
            ctx.fill();

            // level bar - front
            if (exp != 0){
                const percent = exp / neededExp * 100;
                let length = 410 / 100 * percent;
                ctx.fillStyle = style.exp_front;
                ctx.beginPath();
                ctx.arc(240, 190, 20, Math.PI * 1.5, Math.PI * 0.5, true);
                ctx.lineTo(240 + length, 210);
                ctx.arc(240 + length, 190, 20, Math.PI * 0.5, Math.PI * 1.5, true);
                ctx.closePath();
                ctx.fill();
            }

            // making a circle of the avatar
            ctx.beginPath();
            ctx.arc(115, 125, 80, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();

            // adding the avatar
            const avatar = await Canvas.loadImage(user.displayAvatarURL({format: "png"}));
            ctx.drawImage(avatar, 35, 45, 160, 160);

            // sending the image
            const attachment = new Discord.MessageAttachment(canvas.toBuffer(), "rank.png");
            message.channel.send(attachment).catch((err) => {
                console.error(err);
            });
        }

        const canvas = Canvas.createCanvas(700, 250);
        const ctx = canvas.getContext("2d");

        ctx.fillStyle = black;
        ctx.fillRect(0, 0, 700, 250);

        let style = {
            back: levels.back,
            front: levels.front,
            exp_back: levels.exp_back,
            exp_front: levels.exp_front
        };
        let level = 0;
        let exp = 0;
        let rank = 0;
        let sql = `SELECT user_id, lvl, exp, style_back, style_front, style_exp_back, style_exp_front FROM levels ORDER BY lvl DESC, exp DESC`;
        con.query(sql, function(err, result) {
            if (err) throw err;
            if (!result.length) return;
            for (let resultItem of result){
                rank++;
                if (resultItem.user_id != user.id) continue;
                level = resultItem.lvl;
                exp = resultItem.exp;
                if (resultItem.style_back){
                    style.back = resultItem.style_back;
                }
                if (resultItem.style_front){
                    style.front = resultItem.style_front;
                }
                if (resultItem.style_exp_back){
                    style.exp_back = resultItem.style_exp_back;
                }
                if (resultItem.style_exp_front){
                    style.exp_front = resultItem.style_exp_front;
                }
                makeImg(level, exp, rank, style);
                break;
            }
            con.end();
        });
    }
}