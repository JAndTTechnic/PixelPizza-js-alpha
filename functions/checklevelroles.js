const mysql = require("mysql");
const {database, pizzaGuild, levelroles} = require("../config.json");

const dbconfig = {
    host: database.host,
    user: database.user,
    password: database.password,
    database: database.database
};

module.exports = {
    async checkLevelRoles(userID, client){
        if (isNaN(parseInt(userID))) return console.error(`'${userID}' is not a number!`);
        const con = mysql.createConnection(dbconfig);
        const sql = `SELECT lvl FROM levels WHERE user_id = '${userID}'`;
        con.query(sql, function(err, result) {
            if (err) throw err;
            if (!result.length) return con.end();
            const level = result[0].lvl;
            const guild = client.guilds.cache.get(pizzaGuild);
            const member = guild.members.cache.get(userID);
            
            function addRole(roleID){
                member.roles.add(roleID);
            }

            function removeRole(roleID){
                member.roles.remove(roleID);
            }

            if (level >= 5 && !member.roles.cache.get(levelroles.five)){
                addRole(levelroles.five);
            } else if (level < 5 && member.roles.cache.get(levelroles.five)){
                removeRole(levelroles.five);
            }

            if (level >= 10 && !member.roles.cache.get(levelroles.ten)){
                addRole(levelroles.ten);
            } else if (level < 10 && member.roles.cache.get(levelroles.ten)){
                removeRole(levelroles.ten);
            }

            if (level >= 25 && !member.roles.cache.get(levelroles.twentyfive)){
                addRole(levelroles.twentyfive);
            } else if (level < 25 && member.roles.cache.get(levelroles.twentyfive)){
                removeRole(levelroles.twentyfive);
            }

            if (level >= 50 && !member.roles.cache.get(levelroles.fifty)){
                addRole(levelroles.fifty);
            } else if (level < 50 && member.roles.cache.get(levelroles.fifty)){
                removeRole(levelroles.fifty);
            }

            if (level >= 100 && !member.roles.cache.get(levelroles.hunderedvip)){
                addRole(levelroles.hunderedvip);
            } else if (level < 100 && member.roles.cache.get(levelroles.hunderedvip)){
                removeRole(levelroles.hunderedvip);
            }
            
            con.end();
        });
    }
}
