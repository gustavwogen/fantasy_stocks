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

module.exports = router;