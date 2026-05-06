require('dotenv').config();
let pg = require('pg');

let con = new pg.Pool({
  host: 'localhost',
  port: 5432, 
  user: process.env.USERDB,
  password: process.env.PASSWORD_DB,
  database: process.env.DB
});

con.query('SELECT 1', (err) => {
  if (err) {
    console.error("Erro ao conectar:", err);
    process.exit(1);
  }
  console.log("Conectado ao banco de dados!");
}); //claude

//W3C
module.exports = con; // linha do código antigo