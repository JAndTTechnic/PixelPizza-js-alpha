const mysql = require('mysql');
const {database, levelprops} = require('../config.json');

const dbconfig = {
    host: database.host,
    user: database.user,
    password: database.password,
    database: database.database
};

module.exports = {
    name: "leveladd",
    description: "add levels to yourself or another user",
    args: true,
    minArgs: 1,
    maxArgs: 2,
    aliases: ["addlevel"],
    usage: "<amount> [user]",
    userLevel: 3,
    execute(message, args, client){
        if (isNaN(parseInt(args[0])) || parseInt(args[0]) < 1) return message.delete();
        let user = message.author;
        if (args.length > 1){
            if (isNaN(parseInt(args[1]))) return message.delete();
            user = client.users.cache.get(args[1]);
        }
        let con = mysql.createConnection(dbconfig);
        let sql = `SELECT exp, lvl FROM levels WHERE user_id = '${user.id}'`;
        con.query(sql, function(err, result) {
            if (err) {
                message.delete();
                throw err;
            }
            if (!result.length) {
                message.delete();
                return con.end();
            }
            const exp = result[0].exp;
            const level = result[0].lvl;
            const wantedLevel = level + (parseInt(args[0]) - 1);
            const wantedExp = levelprops.baseexp * (wantedLevel + 1) + levelprops.addexp * wantedLevel;
            sql = `UPDATE levels SET lvl = ${wantedLevel + 1}, exp = ${wantedExp} WHERE user_id = '${user.id}'`;
            con.query(sql, function(err) {
                if (err) {
                    message.delete();
                    throw err;
                }
                require('../functions/checklevelroles').checkLevelRoles(user.id, client);
                message.delete();
                con.end();
            });
        });
    }
}