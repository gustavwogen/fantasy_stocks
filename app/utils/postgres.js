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

const getCash = async (portfolioId)=> {
    try {
        const client = await pool.connect();
        console.log("client");
        const result = await client.query(`SELECT portfolio_id, cash from portfolios where portfolio_id=$1`, [portfolioId])
        console.log("result");
        await client.end()
        console.log("client close");
        return result.rows;
    } catch (error) {
        return error;
    }
}

const getQuantity = async (portfolioId, ticker)=> {
    try {
        const client = await pool.connect();
        const result = await client.query(`
        SELECT quantity FROM
            (SELECT symbol, portfolio_id
                ,sum(CASE 
                        WHEN order_type = 'BUY'
                            THEN quantity*unit_price
                        ELSE 0
                        END) AS BuyAmount
                ,sum(CASE 
                        WHEN order_type = 'SELL'
                            THEN quantity*unit_price
                        ELSE 0
                        END) AS SellAmount
                ,sum((CASE WHEN order_type = 'BUY' THEN quantity*unit_price ELSE 0 END)
                    -
                    (CASE WHEN order_type = 'SELL' THEN quantity*unit_price ELSE 0 END))
                    as total
                ,sum((CASE WHEN order_type = 'BUY' THEN quantity ELSE 0 END)
                    -
                    (CASE WHEN order_type = 'SELL' THEN quantity ELSE 0 END))
                    as quantity
            FROM orders
            WHERE portfolio_id=$1
            GROUP BY symbol, portfolio_id
            ORDER BY symbol) AS foo 
            WHERE symbol=$2;`, [portfolioId, ticker])
        await client.end()
        return result.rows;
    } catch (error) {
        return error;
    }
}

const getPortfolioHoldings = async (portfolioId) => {
    try {
        const client = await pool.connect();
        const result = await client.query(
            `SELECT 
             symbol,
             sum(CASE WHEN order_type = 'BUY' THEN quantity*unit_price ELSE 0 END) AS BuyAmount,
             sum(CASE WHEN order_type = 'SELL' THEN quantity*unit_price ELSE 0 END) AS SellAmount,
             sum((case when order_type = 'BUY' then 1 else -1 end) * quantity * unit_price) as total,
             sum((case when order_type = 'BUY' then 1 else -1 end) * quantity) as quantity
             FROM orders
             WHERE portfolio_id=$1
             GROUP BY symbol, portfolio_id
             ORDER BY symbol;`, [portfolioId]
        )
        await client.end();
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
    getPortfolioHoldings,
    buyOrderCash,
    sellOrderCash,
    getCash,
    getQuantity
}