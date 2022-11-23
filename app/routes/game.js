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
    res.render('game/create_game');
});

router.post("/create", asyncHandler(async (req, res) => {
    let userId = Number(req.user.user_id);
    let gameName = req.body.name;
    let cash = Number(req.body.cash);
    let userList = req.body.users;
    let endDate = req.body.date;

    //First create game from input, then use that game-ID to create a portfolio and link the game-ID with the user-ID of creator
    //Then loop through the list of all users that should be in the game and do the same
    await db.createGame(pool, userId, gameName, cash, endDate);
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

router.use("/:gameId", auth.game);

router.get("/:gameId", asyncHandler(async (req, res) => {
    let gameId = req.params.gameId;
    //console.log(req.user);
    
    let portfolios = await db.getGamePortfolios(pool, gameId);
    let portfolioIds = portfolios.map(row => Number(row.portfolio_id));
    let cashList = portfolios.map(row => row.cash);
    let names = portfolios.map(row => row.name);
    let allUserIds = portfolios.map(row => row.user_id);
  
    gameName = await db.getGameName(pool, gameId);
    holdings = await db.getOriginalValues(pool, portfolioIds);

    //console.log(holdings);
    //console.log(portfolios);

    res.render('game/view_game', {
        cash: cashList,
        portfolios: portfolios,
        holdings: holdings,
        //totalPortfolioValue: parseFloat(cashList[0]) + parseFloat(portfolioStockValue),
        gameName: gameName[0].game_name
    });

}));

module.exports = router;