const mysql = require('mysql');

var db_config = {
    host: '37.59.55.185',
    user: 'Krgdge3bYm',
    password: 'T2nJhZlSAM',
    database: 'Krgdge3bYm'
};

module.exports = {
    async addExp(amount, userID){
        if (isNaN(amount)) return console.log(`${amount} is not a number!`);
        const con = mysql.createConnection(db_config);
        const sql = `UPDATE levels SET exp = exp + ${amount} WHERE user_id = '${userID}'`;
        con.query(sql, function(err) {
            if (err) throw err;
            con.end();
        });
        await require("./updatelevel").updateLevel(userID);
    }
}