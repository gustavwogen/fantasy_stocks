let express = require("express");
let { Pool } = require("pg");
let bcrypt = require("bcrypt");
const crypto = require('crypto');
let cookieParser = require("cookie-parser");
let bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();
let sessions = require('express-session');
const path = require('path')
const asyncHandler = require('express-async-handler')
require('express-async-errors')

let iex = require('./utils/iex');
let db = require('./utils/postgres');

let env = require("../env.json");

let hostname = "localhost";
let port = 3000;
let app = express();


app.set(path.join(__dirname, 'views'))
app.set('view engine', 'pug')


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

let pool = new Pool(env);
pool.connect().then(() => {
    console.log("Connected to database");
});

// https://github.com/kelektiv/node.bcrypt.js#a-note-on-rounds
let saltRounds = 10;

const generateAuthToken = () => {
    return crypto.randomBytes(32).toString('hex');
}

// This will hold the users and authToken related to users
// Ideally this should be stored in Redis or some other db instead
const authTokens = {};

app.get('/bootstrap', asyncHandler(async (req, res) => {
    var portfolios = await db.getPortfolios(pool, 1);
    var holdings = await db.getPortfolioHoldings(pool, 1);
    console.log(holdings);
    res.render('base_index', {
        test: "fantasyStocks",
        portfolios: portfolios
    });
}));

app.get("/portfolio/:portfolioId", asyncHandler(async (req, res) => {
    let portfolioId = req.params.portfolioId;
    var portfolioCash = await db.getCash(pool, portfolioId);
    console.log("portfolio cash", portfolioCash);

    var holdings = await db.getPortfolioHoldings(pool, portfolioId);
    let tickerList = holdings.map(row => row.symbol);

    // calculate current value for each stock based on current price and quantity
    for (let row of holdings) {
        let price = await iex.getPrice(row.symbol);
        console.log(row.symbol, price.data);
        row.current_value = parseFloat(price.data) * parseFloat(row.quantity);
    }
    
    // get the total value of all the stocks in the portfolio
    var portfolioStockValue = holdings.reduce((a, row) => a + parseFloat(row.current_value), 0);

    var quotes = await iex.getQuotes(tickerList.join());
    quotes = quotes.data;
    holdings.forEach((row) => {
        quotes[row.symbol]['portfolio'] = row
    });
    res.render('portfolio', {
        holdings: Object.values(quotes),
        cash: portfolioCash[0].cash,
        totalPortfolioValue: parseFloat(portfolioCash[0].cash) + parseFloat(portfolioStockValue)
    });
}));

app.get("/user/create", (req, res) => {
    res.render('create_user');
});

app.post("/user/create", (req, res) => {
    let username = req.body.username;
    let plaintextPassword = req.body.password;
    let email = req.body.email;

    bcrypt
        .hash(plaintextPassword, saltRounds)
        .then((hashedPassword) => {
            pool.query(
                "INSERT INTO users (username, password, email) VALUES ($1, $2, $3)",
                [username, hashedPassword, email]
            )
                .then(() => {
                    // account created
                    console.log(username, "account created");
                    res.status(200);
                    res.render('create_user', {
                        user_created: true,
                        username: username
                    })
                })
                .catch((error) => {
                    // insert failed
                    if (error.detail === `Key (username)=(${username}) already exists.`) {
                        res.status(401);
                        res.render('create_user', {
                            username_taken: true,
                            username: username
                        })
                        // return res.status(401).send("Username is already taken.");
                    } else {
                        return res.status(500).send("Account creation failed");
                    }
                });
        })
        .catch((error) => {
            // bcrypt crashed
            console.log(error);
            res.status(500).send();
        });
});

app.get('/user/login', (req, res) => {
    res.render('login');
});

app.post("/user/login", asyncHandler(async (req, res) => {
    let username = req.body.username;
    let plaintextPassword = req.body.password;
    const result = await pool.query("SELECT password FROM users WHERE username = $1", [username])
    if (result.rows.length === 0) {
        res.status(401);
        res.render('login', {
            error: "Incorrect username or password"
        })
    } else {
        let hashedPassword = result.rows[0].password;
        let passwordMatched = await bcrypt.compare(plaintextPassword, hashedPassword);
        if (passwordMatched) {
            console.log('password matched');
            let user_query = await pool.query("SELECT user_id FROM users WHERE username = $1", [username])
            console.log(user_query);
            if (user_query.rows.length > 0) {
                var user_id = user_query.rows[0].user_id;
                const authToken = generateAuthToken();
                let portfolios = await db.getPortfolios(pool, user_id);
                portfolios = portfolios.reduce((obj, item) => (obj[item.portfolio_id] = item, obj) ,{})
                // Store authentication token
                authTokens[authToken] = {
                    username: username,
                    user_id: user_id,
                    portfolios: portfolios
                };
                console.log(authTokens[authToken]);
                // Setting the auth token in cookies
                res.cookie('AuthToken', authToken);
                return res.redirect("/");
            }
        } else {
            console.log('not matched password');
            res.status(401);
            return res.render('login', {
                error: "Incorrect username or password"
            });
        }
    }
}));

app.get("/user/logout", (req,res) => {
    res.cookie('AuthToken', 'None')
    res.redirect('/user/login');
});

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
    console.log(res.locals.user);
    res.render('index');
    // res.sendFile('public/index.html', {root: __dirname})
})

// Show portfolio 
app.get("/portfolio", (req, res) => {
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

app.get('/create/portfolio', function (req, res) {
    res.sendFile('public/portfolioCreate.html' , { root : __dirname});
});

app.post("/create/portfolio", (req, res) => {
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
