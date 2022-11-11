let { Pool } = require("pg");
let env = require("../../env.json");

let pool = new Pool(env);

const getPortfolios = async (userId)=> {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * from portfolios where user_id = $1', [userId])
        await client.end()
        return result.rows;
    } catch (error) {
        return error;
    }
}

module.exports = {
    getPortfolios
}