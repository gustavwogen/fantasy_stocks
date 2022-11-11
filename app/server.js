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

let iex = require('./utils/iex');
let db = require('./utils/postgres');

// Any way to get around this?
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
    console.log(res.locals);
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
    var portfolios = await db.getPortfolios(2);
    console.log('portfolios', portfolios);
    res.render('base_index', {
        test: "fantasyStocks",
        portfolios: portfolios
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

app.post("/user/login", (req, res) => {
    console.log(req.body);
    let username = req.body.username;
    let plaintextPassword = req.body.password;
    pool.query("SELECT password FROM users WHERE username = $1", [
        username,
    ])
        .then((result) => {
            if (result.rows.length === 0) {
                // username doesn't exist
                res.status(401);
                return res.render('login', {
                    error: "Incorrect username or password"
                });
            }
            let hashedPassword = result.rows[0].password;
            bcrypt
                .compare(plaintextPassword, hashedPassword)
                .then((passwordMatched) => {
                    if (passwordMatched) {
                        console.log('password mathed');
                        pool.query("SELECT user_id FROM users WHERE username = $1", [
                            username,
                        ]).then((result) => {
                            console.log(result.rows);
                            if (result.rows.length > 0) {
                                var user_id = result.rows[0].user_id;
                                const authToken = generateAuthToken();
                                // Store authentication token
                                authTokens[authToken] = {
                                    username: username,
                                    user_id: user_id
                                };
                                // Setting the auth token in cookies
                                res.cookie('AuthToken', authToken);
                                return res.redirect("/");
                            }
                        })
                    } else {
                        console.log('not matched password');
                        res.status(401);
                        return res.render('login', {
                            error: "Incorrect username or password"
                        });
                    }
                })
                .catch((error) => {
                    // bcrypt crashed
                    console.log('bcrypt error: ' + error.message)
                    console.log(error);
                    res.status(500).send();
                });
        })
        .catch((error) => {
            // select crashed
            console.log('server error');
            console.log(error);
            res.status(500).send();
        });
});

app.get("/user/logout", (req,res) => {
    res.cookie('AuthToken', 'None')
    res.redirect('/user/login');
});

function requireAuth(req, res, next) {
    if (req.user) {
        next();
    } else {
        console.log("Redirecting to /user/login");
        res.redirect('/user/login');
    }
};

// app.use(requireAuth); // user will need to be logged in to access any route under this line 


app.get("/", (req, res) => {
    let user = req.user; 
    // we can access the username of the currently logged in user this way
    // lets us query data from the database
    // res.render('home', {
    //     user_id: user.user_id,
    //     username: user.username,
    // })
    res.sendFile('public/index.html', {root: __dirname})
})

// Show portfolio 
app.get("/portfolio", (req, res) => {
    portfolioId = req.query.portfolioId;
    pool.query(
        `SELECT symbol, portfolio_id
            ,sum(CASE 
                    WHEN order_type = 'BUY'
                        THEN quantity*unit_price
                    ELSE 0
                    END) AS BuyAmount
            ,sum(CASE 
                    WHEN order_type = 'SELL'
                        THEN quantity*unit_price
                    ELSE 0
                    END) AS SellAmount
            ,sum((CASE WHEN order_type = 'BUY' THEN quantity*unit_price ELSE 0 END)
                -
                (CASE WHEN order_type = 'SELL' THEN quantity*unit_price ELSE 0 END))
                as total
            ,sum((CASE WHEN order_type = 'BUY' THEN quantity ELSE 0 END)
                -
                (CASE WHEN order_type = 'SELL' THEN quantity ELSE 0 END))
                as quantity
        FROM orders
        WHERE portfolio_id=$1
        GROUP BY symbol, portfolio_id
        ORDER BY symbol;`, [portfolioId]
    ).then(result => {
        return res.json({"rows": result.rows});
    });
})

app.get("/search", (req, res) => {
    if (!req.query.ticker) {
        res.render("search_bootstrap");
    } else {
        let ticker = req.query.ticker;
        iex.getQuotes(ticker).then((response) => {
            if (response.status === 200) {
                var data = response.data;
                data = data[ticker.toUpperCase()]['quote'];
                res.render('search_bootstrap', data);
            } else {
                console.log("Message: " + response.data);
                res.status(response.status);
                res.render('search_bootstrap', {error: response.data});
            }
        }).catch((error) => {
            console.log(error);
            res.sendStatus(500);
        });
    }
});

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
app.get("/quote", (req, res) => {
    let ticker = req.query.symbol;
    iex.getQuotes(ticker).then((response) => {
        if (response.status === 200) {
            var data = response.data;
            res.json(data);
        } else {
            console.log("Message: " + response.data.error);
        }
    }).catch((error) => {
        console.log(error);
    });
})

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
    let quantity = req.query.quantity;
    let portfolioId = req.query.portfolioId;
    let price = req.query.price;

    let cashResponse = await db.getCash(portfolioId);
    let currentCash = cashResponse[0].cash;
    totalValue = quantity*price;
    let run = false;

    let quantityResponse = await db.getQuantity(portfolioId, ticker)
    let totalQuantity = quantityResponse[0].quantity
    console.log(totalQuantity);

    console.log(`${totalValue} < ${currentCash}`);
    console.log(`${quantity} < ${totalQuantity}`);

    if ((orderType === 'BUY') &&  (currentCash > totalValue)) {
        db.buyOrderCash(totalValue, portfolioId);
        run = true;
    } else if ((orderType === 'SELL') && (quantity < totalQuantity)) {
        db.sellOrderCash(totalValue, portfolioId);
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


app.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}`);
});
