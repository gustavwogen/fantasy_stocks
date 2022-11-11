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

const buyOrderCash = async (totalValue, portfolioId)=> {
    try {
        const client = await pool.connect();
        const result = await client.query(`UPDATE portfolios set cash=cash-$1 where portfolio_id=$2;`,[totalValue, portfolioId])
        await client.end()
        return result.rows;
    } catch (error) {
        return error;
    }
}

const sellOrderCash = async (totalValue, portfolioId)=> {
    try {
        const client = await pool.connect();
        const result = await client.query(`UPDATE portfolios set cash=cash+$1 where portfolio_id=$2;`,[totalValue, portfolioId])
        await client.end()
        return result.rows;
    } catch (error) {
        return error;
    }
}

module.exports = {
    getPortfolios,
    buyOrderCash,
    sellOrderCash,
}