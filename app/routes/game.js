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

// Show Games
router.get("/", (req, res) => {
    portfolioId = req.query.portfolioId;
    pool.query(
        `select * from games where user_id=$1;`, [req.user.user_id]
    ).then(result => {
        return res.json({"rows": result.rows});
    });
})

router.get('/create', function (req, res) {
    res.render('create_games');
});

router.post("/create", asyncHandler(async (req, res) => {
    let userId = Number(req.user.user_id);
    let gameName = req.body.name;
    let cash = Number(req.body.cash);
    let userList = req.body.users;
    // console.log("User ID:",userId);
    // console.log("Game name:",gameName);
    // console.log("Cash:",cash);
    // console.log("MyUser:",req.user.username);
    // console.log("Users:",req.body.users);

    //First create game from input, then use that game-ID to create a portfolio and link the game-ID with the user-ID of creator
    //Then loop through the list of all users that should be in the game and do the same
    await db.createGame(pool, userId, gameName, cash);
    gameIdResponse = await db.getGameId(pool, gameName);
    gameId = gameIdResponse[0].game_id;
    await db.createPortfolio(pool, userId, gameName + " " + req.user.username, cash, gameId);
    await db.linkGame(pool, userId, gameId);

    for (i in userList) {
        userIdResponse = await db.getUserId(pool, userList[i]);
        specificUserId = userIdResponse[0].user_id;
        await db.createPortfolio(pool, specificUserId, gameName + " " + userList[i], cash, gameId);
        await db.linkGame(pool, specificUserId, gameId);
        console.log("created portfolio for", userList[i]);
    }
    return res.redirect('/game/create');
}));


router.get("/:gameId", asyncHandler(async (req, res) => {
    let gameId = req.params.gameId;
    let userId = req.user.user_id;
    console.log(gameId, userId);
    let portfolioIdPromise = await db.getGamePortfolios(pool, gameId, userId);
    let portfolioId = portfolioIdPromise[0].portfolio_id;
    console.log(portfolioId);
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

    gameName = await db.getGameName(pool, gameId);
    console.log(gameName);

    console.log(quotes);
    res.render('game', {
        holdings: Object.values(quotes),
        cash: portfolioCash[0].cash,
        totalPortfolioValue: parseFloat(portfolioCash[0].cash) + parseFloat(portfolioStockValue),
        gameName: gameName[0].game_name
    });
}));

module.exports = router;