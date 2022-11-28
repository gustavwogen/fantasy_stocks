
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

const getUserGames = async (pool, userId)=> {
    try {
        const result = await pool.query(
            `select g.*
             from users_games ug
             join games g on g.game_id = ug.game_id
             where ug.user_id = $1;`,
            [userId])
        return result.rows;
    } catch (error) {
        return error;
    }
}

const getUserNameFromPortfolio = async (pool, portfolioId)=> {
    try {
        const result = await pool.query(
            `select username from users where user_id = (select user_id from portfolios where portfolio_id = $1);`,
            [portfolioId])
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
            `SELECT * FROM
            (SELECT 
            symbol,
            sum(CASE WHEN o.order_type = 'BUY' THEN o.quantity*o.unit_price ELSE 0 END) AS BuyAmount,
            sum(CASE WHEN o.order_type = 'SELL' THEN o.quantity*o.unit_price ELSE 0 END) AS SellAmount,
            sum((CASE WHEN o.order_type = 'BUY' THEN 1 ELSE -1 END) * o.quantity * o.unit_price) as total,
            sum((CASE WHEN o.order_type = 'BUY' THEN 1 ELSE -1 END) * o.quantity) as quantity
            FROM orders o JOIN portfolios p ON p.portfolio_id=o.portfolio_id
            WHERE o.portfolio_id=$1
            GROUP BY symbol, o.portfolio_id
            ORDER BY symbol) e
        WHERE quantity>0;`, [portfolioId]
        )
        return result.rows;
    } catch (error) {
        return error;
    }
}

const getOriginalValues = async (pool, portfolioId) => {
    try {
        console.log(portfolioId);
        const result = await pool.query(
            `SELECT 
            portfolio_id,        
            sum(CASE WHEN order_type = 'BUY' THEN quantity*unit_price ELSE 0 END) AS BuyAmount,
            sum(CASE WHEN order_type = 'SELL' THEN quantity*unit_price ELSE 0 END) AS SellAmount,
            sum((case when order_type = 'BUY' then 1 else -1 end) * quantity * unit_price) as total,
            sum((case when order_type = 'BUY' then 1 else -1 end) * quantity) as quantity
            FROM orders
            WHERE portfolio_id = ANY($1::int[])
            GROUP BY portfolio_id
            ORDER BY portfolio_id;`, [portfolioId]
        )
        return result.rows;
    } catch (error) {
        return error;
    }
}

const getGamePortfolios = async (pool, gameId)=> {
    try {
        const result = await pool.query('SELECT * from portfolios where game_id = $1 order by cash desc', [gameId])
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

const getGameUsers = async (pool, gameId)=> {
    try {
        const result = await pool.query('SELECT user_id from users_games where game_id = $1', [gameId])
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

const createGame = async (pool, userId, gameName, cash, endDate) => {
    try {
        const result = await pool.query("INSERT INTO games (user_id, game_name, start_cash, start_date, end_date) VALUES ($1, $2, $3, now() at time zone 'utc', $4)",
        [userId, gameName, cash, endDate])    
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
    getUserGames,
    getUserNameFromPortfolio,
    getUserId,
    getGameId,
    getPortfolioHoldings,
    getOriginalValues,
    getGamePortfolios,
    getGameName,
    getGameUsers,
    buyOrderCash,
    sellOrderCash,
    getCash,
    getQuantity,
    createPortfolio,
    createGame,
    linkGame,
}