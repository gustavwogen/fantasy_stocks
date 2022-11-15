let express = require("express");
let pool = require('./utils/dbConn')
let cookieParser = require("cookie-parser");
let bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();
let sessions = require('express-session');
const path = require('path')
const asyncHandler = require('express-async-handler')
require('express-async-errors');


// Routes
const user = require('./routes/user');
const portfolio = require('./routes/portfolio');


let iex = require('./utils/iex');
let db = require('./utils/postgres');

let env = require("../env.json");

let hostname = "localhost";
let port = 3000;
let app = express();


app.set(path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('authTokens', {});


// creating 24 hours from milliseconds
const oneDay = 1000 * 60 * 60 * 24;

//session middleware
app.use(sessions({
    // change this value later
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false
}));

function logger(req, res, next) {
    console.log("URL: " + req.url);
    next();
};

app.use(logger);

// cookie parser middleware
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true })); 

app.use(upload.array()); 

app.use((req, res, next) => {
    // Get auth token from the cookies
    const authToken = req.cookies['AuthToken'];

    // Inject the user to the request
    var authTokens = req.app.get('authTokens');
    req.user = authTokens[authToken];
    res.locals.user = req.user;
    // for testing
    req.user = {
        username: 'admin',
        user_id: 1,
        portfolios: {
          '1': {
            portfolio_id: 1,
            user_id: 1,
            name: 'to the moon',
            cash: '63219.29',
            created_at: "2022-11-13T04:19:18.119Z"
          },
          '2': {
            portfolio_id: 2,
            user_id: 1,
            name: '2nd portfolio',
            cash: '100000',
            created_at: "2022-11-13T04:19:18.119Z"
          }
        }
      }
    // for testing
    res.locals.user = {
        username: 'admin',
        user_id: 1,
        portfolios: {
          '1': {
            portfolio_id: 1,
            user_id: 1,
            name: 'to the moon',
            cash: '63219.29',
            created_at: "2022-11-13T04:19:18.119Z"
          },
          '2': {
            portfolio_id: 2,
            user_id: 1,
            name: '2nd portfolio',
            cash: '100000',
            created_at: "2022-11-13T04:19:18.119Z"
          }
        }
      }
    next();
});


app.use(express.json());
app.use(express.static('public'));

app.use("/user", user);
app.use("/portfolio", portfolio);



function requireAuth(req, res, next) {
    console.log('requireAuth');
    if (req.user) {
        next();
    } else {
        console.log("Redirecting to /user/login");
        res.redirect('/user/login');
    }
};

//app.use(requireAuth); // user will need to be logged in to access any route under this line 


app.get("/", (req, res) => {
    let user = req.user;
    // we can access the username of the currently logged in user this way
    // lets us query data from the database
    // console.log(res.locals.user);
    res.render('index');
    // res.sendFile('public/index.html', {root: __dirname})
})

app.get("/search", asyncHandler(async (req, res) => {
    if (!req.query.ticker) {
        res.render("search_bootstrap");
    } else {
        let ticker = req.query.ticker;
        let iexResponse = await iex.getQuotes(ticker);
        if (200 <= iexResponse.status && iexResponse.status <= 299) {
            res.render("search_bootstrap", iexResponse.data[ticker.toUpperCase()]['quote']);
        }  else {
            console.log(iexResponse.status);
            res.status(iexResponse.status)
            res.render('search_bootstrap', {error: iexResponse.data});
        }
    }
}));

// Post Quote - 1 ticker
app.post("/quote", (req, res) => {
    if (req.body.symbol) {
        let ticker = req.body.symbol;
        iex.getQuote(ticker).then((response) => {
            if (response.status === 200) {
                var data = response.data;
                return res.json(data);
            } else {
                return res.status(response.status).json({data: response.data})
            }
        }).catch((error) => {
            console.log(error);
        });
    }
});

// Get quote - Multiple tickers
app.get("/quote", asyncHandler(async (req, res) => {
    let tickers= req.query.symbol;
    let response = await iex.getQuotes(tickers)
    res.json(response.data);
}))

// Get Price - 1 ticker
app.get("/price", (req, res) => {
    let ticker = req.query.symbol;
    iex.getQuote(ticker).then((response) => {
        if (response.status === 200) {
            console.log(data);
            var data = response.data;
            res.json(data);
        } else {
            console.log("Message: " + response.data.error);
        }
    }).catch((error) => {
        console.log(error);
    });
})

app.get("/placeOrder", asyncHandler(async (req, res) => {
    let ticker = req.query.symbol.toUpperCase();
    let orderType = req.query.orderType.toUpperCase();
    let quantity = Number(req.query.quantity);
    let portfolioId = Number(req.query.portfolioId);
    let price = Number(req.query.price);

    let cashResponse = await db.getCash(pool, portfolioId);
    let currentCash = Number(cashResponse[0].cash);
    totalValue = quantity*price;
    let run = false;

    let quantityResponse = await db.getQuantity(pool, portfolioId, ticker);
    let totalQuantity = Number(quantityResponse[0].quantity);

    console.log(`${totalValue} < ${currentCash}`);
    console.log(`${quantity} < ${totalQuantity}`);

    if ((orderType === 'BUY') && (currentCash > totalValue)) {
        db.buyOrderCash(pool, totalValue, portfolioId);
        run = true;
    } else if ((orderType === 'SELL') && (quantity < totalQuantity)) {
        db.sellOrderCash(pool, totalValue, portfolioId);
        run = true
    } else if ((orderType === 'BUY') && (currentCash < totalValue)) {
        console.log("Not enough cash");
        return res.json("Not enough cash");
    } else if ((orderType === 'SELL') && (quantity > totalQuantity)) {
        console.log("Do not own required quantity");
        return res.json("Do not own required quantity");
    }

    if (run) {
        console.log(ticker, orderType, quantity, portfolioId, price);
        pool.query(`
            INSERT INTO orders (portfolio_id, order_type, symbol, quantity, unit_price) 
            VALUES ($1, $2, $3, $4, $5);`,
            [portfolioId, orderType, ticker, quantity, price]
        ).then(result => {
            return res.json(result);
        });
    }
}))

app.get("/cash", (req, res) => {
    let portfolioId = req.query.portfolioId;
    pool.query(`
        SELECT portfolio_id, cash from portfolios where portfolio_id=$1`,
        [portfolioId]
    ).then(result => {
        return res.json(result);
    });
})


app.get(`/game/create`, (req, res) => {
    res.render('create_games');
})

app.post("/game/create", asyncHandler(async (req, res) => {
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

app.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}`);
});
