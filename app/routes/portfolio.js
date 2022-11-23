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
let auth = require('../utils/authorization');

router.use(bodyParser.urlencoded({ extended: true }));
router.use(upload.array()); 
router.use(cookieParser());


// Show portfolio 
router.get("/", (req, res) => {
    portfolioId = req.query.portfolioId;
    pool.query(
        `SELECT * FROM
            (SELECT 
            symbol,
            sum(CASE WHEN o.order_type = 'BUY' THEN o.quantity*o.unit_price ELSE 0 END) AS BuyAmount,
            sum(CASE WHEN o.order_type = 'SELL' THEN o.quantity*o.unit_price ELSE 0 END) AS SellAmount,
            sum((CASE WHEN o.order_type = 'BUY' THEN 1 ELSE -1 END) * o.quantity * o.unit_price) as total,
            sum((CASE WHEN o.order_type = 'BUY' THEN 1 ELSE -1 END) * o.quantity) as quantity
            FROM orders o JOIN portfolios p ON p.portfolio_id=o.portfolio_id
            WHERE o.portfolio_id=1
            GROUP BY symbol, o.portfolio_id
            ORDER BY symbol) e
        WHERE quantity>0;`, [portfolioId]
    ).then(result => {
        return res.json({"rows": result.rows});
    });
})

router.get('/create', function (req, res) {
    res.render('portfolio/create_portfolio');
});

router.post("/create", (req, res) => {
    let userID = req.user.user_id;
    console.log(userID);
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

router.use("/:portfolioId", auth.portfolio);

router.get("/:portfolioId", asyncHandler(async (req, res) => {
    let portfolioId = req.params.portfolioId;
    var portfolioCash = await db.getCash(pool, portfolioId);
    var holdings = await db.getPortfolioHoldings(pool, portfolioId);

    if (holdings.length === 0) {
        return res.render('portfolio/view_portfolio', {
            holdings: [],
            cash: portfolioCash[0].cash
        });
    } else {
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
        var originalValue = holdings.reduce((a, row) => a + parseFloat(row.total), 0);
        
        // Calculate the total yield of the portfolio
        var totalYield = parseFloat((portfolioStockValue/originalValue) - 1)

        holdings.forEach((row) => {
            quotes[row.symbol]['portfolio'] = row
        });

        //console.log(quotes);
        res.render('portfolio/view_portfolio', {
            holdings: Object.values(quotes),
            cash: portfolioCash[0].cash,
            totalPortfolioValue: parseFloat(portfolioCash[0].cash) + parseFloat(portfolioStockValue),
            totalYield: totalYield
        });
    }
}));



module.exports = router;