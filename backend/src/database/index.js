const pgp = require('pg-promise')();

const db = pgp({
  host: 'localhost',
  port: 5432,
  database: 'não sei',
  user: 'postgres',
  password: 'não sei ainda',
});

module.exports = db;