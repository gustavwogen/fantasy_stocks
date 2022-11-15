const express = require('express')
const router = express.Router()
let bodyParser = require('body-parser');
let cookieParser = require("cookie-parser");
var multer = require('multer');
var upload = multer();
const asyncHandler = require('express-async-handler')
require('express-async-errors');

// Utility functions
let pool = require('../utils/dbConn');
let db = require('../utils/postgres');
let iex = require('../utils/iex');

router.use(bodyParser.urlencoded({ extended: true }));
router.use(upload.array()); 
router.use(cookieParser());


// Show portfolio 
router.get("/", (req, res) => {
    portfolioId = req.query.portfolioId;
    pool.query(
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
    ).then(result => {
        return res.json({"rows": result.rows});
    });
})

router.get('/create', function (req, res) {
    res.sendFile('public/portfolioCreate.html' , { root : process.cwd()});
});

router.post("/create", (req, res) => {
    let userID = req.user.user_id;
    let name = req.body.name;
    let cash = req.body.cash;
    console.log(req.user.user_id);
    pool.query(
        "INSERT INTO portfolios (user_id, name, cash) VALUES ($1, $2, $3)",
        [userID, name, cash]
    )
        .then(() => {
            // portfolio created
            console.log(name, "portfolio created");
            res.status(200).send();
        })
        .catch((error) => {
            // insert failed
            console.log(error);
            return res.status(500).send("Portfolio creation failed");
        });
});


router.get("/:portfolioId", asyncHandler(async (req, res) => {
    let portfolioId = req.params.portfolioId;
    var portfolioCash = await db.getCash(pool, portfolioId);

    var holdings = await db.getPortfolioHoldings(pool, portfolioId);
    let tickerList = holdings.map(row => row.symbol);

    var quotes = await iex.getQuotes(tickerList.join());
    quotes = quotes.data;

    // transform holdings array into an object
    var holdings_object = holdings.reduce((obj, item) => (obj[item.symbol] = item, obj) ,{});

    // for each symbol calculate the current value in the portfolio
    Object.keys(quotes).forEach(key => {
        holdings_object[key].current_value = parseInt(holdings_object[key].quantity) * quotes[key].quote.latestPrice
    });
    
    var holdings = Object.values(holdings_object);

    // // get the total value of all the stocks in the portfolio
    var portfolioStockValue = holdings.reduce((a, row) => a + parseFloat(row.current_value), 0);

    holdings.forEach((row) => {
        quotes[row.symbol]['portfolio'] = row
    });

    console.log(quotes);
    res.render('portfolio', {
        holdings: Object.values(quotes),
        cash: portfolioCash[0].cash,
        totalPortfolioValue: parseFloat(portfolioCash[0].cash) + parseFloat(portfolioStockValue)
    });
}));



module.exports = router;