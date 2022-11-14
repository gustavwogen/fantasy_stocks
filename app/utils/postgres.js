

const getPortfolios = async (pool, userId)=> {
    try {
        const result = await pool.query('SELECT * from portfolios where user_id = $1', [userId])
        return result.rows;
    } catch (error) {
        return error;
    }
}

const getCash = async (pool, portfolioId)=> {
    try {
        const result = await pool.query(`SELECT portfolio_id, cash from portfolios where portfolio_id=$1`, [portfolioId])
        return result.rows;
    } catch (error) {
        return error;
    }
}

const getQuantity = async (pool, portfolioId, ticker)=> {
    try {
        const result = await pool.query(`
        SELECT 
        sum((case when order_type = 'BUY' then 1 else -1 end) * quantity) as quantity
        FROM orders
        WHERE portfolio_id=$1 and symbol=$2
        GROUP BY symbol, portfolio_id;`, [portfolioId, ticker])
        return result.rows;
    } catch (error) {
        return error;
    }
}

const getPortfolioHoldings = async (pool, portfolioId) => {
    try {
        const result = await pool.query(
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
        return result.rows;
    } catch (error) {
        return error;
    }
}

const buyOrderCash = async (pool, totalValue, portfolioId)=> {
    try {
        const result = await pool.query(`UPDATE portfolios set cash=cash-$1 where portfolio_id=$2;`,[totalValue, portfolioId])
        return result.rows;
    } catch (error) {
        return error;
    }
}

const sellOrderCash = async (pool, totalValue, portfolioId)=> {
    try {
        const result = await pool.query(`UPDATE portfolios set cash=cash+$1 where portfolio_id=$2;`,[totalValue, portfolioId])
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