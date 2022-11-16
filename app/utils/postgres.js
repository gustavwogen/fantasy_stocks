
const getPortfolios = async (pool, userId)=> {
    try {
        const result = await pool.query('SELECT * from portfolios where user_id = $1', [userId])
        return result.rows;
    } catch (error) {
        return error;
    }
}

const getGames = async (pool, gameId)=> {
    try {
        const result = await pool.query('SELECT * from games where user_id = $1', [gameId])
        return result.rows;
    } catch (error) {
        return error;
    }
}

const getUserId = async (pool, name)=> {
    try {
        const result = await pool.query('SELECT user_id from users where username = $1', [name])
        return result.rows;
    } catch (error) {
        return error;
    }
}

const getGameId = async (pool, gameName)=> {
    try {
        const result = await pool.query('SELECT game_id from games where game_name = $1', [gameName])
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

const getGamePortfolios = async (pool, gameId, userId)=> {
    try {
        const result = await pool.query('SELECT portfolio_id from portfolios where game_id = $1 AND user_id = $2 ', [gameId, userId])
        return result.rows;
    } catch (error) {
        return error;
    }
}

const getGameName = async (pool, gameId)=> {
    try {
        const result = await pool.query('SELECT game_name from games where game_id = $1', [gameId])
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

const createPortfolio = async (pool, userId, name, cash, gameId)=> {
    try {
        const result = await pool.query("INSERT INTO portfolios (user_id, name, cash, game_id) VALUES ($1, $2, $3, $4)",
        [userId, name, cash, gameId])
        return result.rows;
    } catch (error) {
        return error;
    }
}

const createGame = async (pool, userId, gameName, cash) => {
    try {
        const result = await pool.query("INSERT INTO games (user_id, game_name, start_cash, start_date, end_date) VALUES ($1, $2, $3, now() at time zone 'utc', (now() + interval '1 month') at time zone 'utc')",
        [userId, gameName, cash])    
        return result.rows;
    } catch (error) {
        return error;
    }
}

const linkGame = async (pool, userId, gameId) => {
    try {
        const result = await pool.query("INSERT INTO users_games (user_id, game_id) VALUES ($1, $2)",
        [userId, gameId])    
        return result.rows;
    } catch (error) {
        return error;
    }
}

module.exports = {
    getPortfolios,
    getGames,
    getUserId,
    getGameId,
    getPortfolioHoldings,
    getGamePortfolios,
    getGameName,
    buyOrderCash,
    sellOrderCash,
    getCash,
    getQuantity,
    createPortfolio,
    createGame,
    linkGame,
}