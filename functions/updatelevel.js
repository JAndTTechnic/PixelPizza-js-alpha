const mysql = require('mysql');
const {database, levelprops} = require("../config.json");

var db_config = {
  host: database.host,
  user: database.user,
  password: database.password,
  database: database.database
};

module.exports = {
  async updateLevel(userID){
    if (isNaN(parseInt(userID))) return console.error(`'${userID}' is not a number!`);
    const con = mysql.createConnection(db_config);
    let sql = `SELECT exp, lvl FROM levels WHERE user_id = '${userID}'`;
    con.query(sql, function(err, result) {
      if (err) throw err;
      if (!result.length) {
        con.end();
        return console.log(`no results found for '${userID}'`);
      }
      const exp = result[0].exp;
      let level = result[0].lvl;
      while (true){
        // exp needed for next level
        let expNeeded = levelprops.baseexp * (level + 1) + levelprops.addexp * level;
        // exp needed for current level
        let expNeededPrev = levelprops.baseexp * level + levelprops.addexp * (level - 1);
        if (exp < expNeededPrev){
          sql = `UPDATE levels SET lvl = lvl - 1 WHERE user_id = '${userID}'`;
          con.query(sql, function(err) {
            if (err) throw err;
          });
          level--;
        } else if (exp >= expNeeded){
          sql = `UPDATE levels SET lvl = lvl + 1 WHERE user_id = '${userID}'`;
          con.query(sql, function(err) {
            if (err) throw err;
          });
          level++;
        } else {
          break;
        }
      }
      con.end();
    });
  }
}
