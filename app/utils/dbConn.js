let { Pool } = require("pg");

let env = require("../../env.json");

let pool = new Pool(env);

module.exports = pool;