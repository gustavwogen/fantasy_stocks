let express = require("express");
let { Pool } = require("pg");
let bcrypt = require("bcrypt");
const crypto = require('crypto');
let cookieParser = require("cookie-parser");
let sessions = require('express-session');
const path = require('path')

const {getQuote} = require('./utils/iex');
const {getQuotes} = require('./utils/iex');

// Any way to get around this?
let env = require("../env.json");

let hostname = "localhost";
let port = 3000;
let app = express();

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

app.use((req, res, next) => {
    // Get auth token from the cookies
    const authToken = req.cookies['AuthToken'];

    // Inject the user to the request
    req.user = authTokens[authToken];
    next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

app.post("/signup", (req, res) => {
    let username = req.body.username;
    let plaintextPassword = req.body.plaintextPassword;
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
                    res.status(200).send();
                })
                .catch((error) => {
                    // insert failed
                    if (error.detail === `Key (username)=(${username}) already exists.`) {
                        return res.status(401).send("Username is already taken.");
                    }
                    return res.status(500).send("Account creation failed");
                });
        })
        .catch((error) => {
            // bcrypt crashed
            console.log(error);
            res.status(500).send();
        });
});

app.post("/signin", (req, res) => {
    let username = req.body.username;
    let plaintextPassword = req.body.plaintextPassword;
    pool.query("SELECT password FROM users WHERE username = $1", [
        username,
    ])
        .then((result) => {
            if (result.rows.length === 0) {
                // username doesn't exist
                return res.status(401).send();
            }
            let hashedPassword = result.rows[0].password;
            bcrypt
                .compare(plaintextPassword, hashedPassword)
                .then((passwordMatched) => {
                    if (passwordMatched) {
                        const authToken = generateAuthToken();
                        // Store authentication token
                        authTokens[authToken] = username;
                        // Setting the auth token in cookies
                        res.cookie('AuthToken', authToken);
                        pool.query("SELECT user_id FROM users WHERE username = $1", [
                            username,
                        ]).then((result) => {
                            if (result.rows.length > 0) {
                                req.user_id = result.rows[0].user_id;
                            }
                        })
                        return res.redirect("/");
                    } else {
                        console.log('not matched password');
                         res.status(401).send();
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

app.get('/user/login', function (req, res) {
    res.sendFile('public/login.html' , { root : __dirname});
});

app.get('/create/portfolio', function (req, res) {
    res.sendFile('public/portfolioCreate.html' , { root : __dirname});
});

app.get("/user/logout", (req,res) => {
    res.cookie('AuthToken', 'None')
    res.redirect('/user/login');
});

app.get("/user/create", (req, res) => {
    res.sendFile('public/create.html' , { root : __dirname});
});

function requireAuth(req, res, next) {
    if (req.user) {
        next();
    } else {
        console.log("Redirecting to /user/login");
        res.redirect('/user/login');
    }
};

app.use(requireAuth); // user will need to be logged in to access any route under this line 


app.get("/", (req, res) => {
    let user = req.user; 
    // we can access the username of the currently logged in user this way
    // lets us query data from the database
    console.log(user);
    res.sendFile('public/index.html' , { root : __dirname});
})

app.get("/portfolio", (req, res) => {
    pool.query(
        `SELECT symbol
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
        GROUP BY symbol
        ORDER BY symbol;`
    ).then(result => {
        return res.json({"rows": result.rows});
    });
})

app.get("/search", (req, res) => {
    res.sendFile('public/search.html' , { root : __dirname});
});

app.post("/quote", (req, res) => {
    if (req.body.symbol) {
        let ticker = req.body.symbol;
        getQuote(ticker).then((response) => {
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

app.get("/quote", (req, res) => {
    let ticker = req.query.symbol;
    getQuotes(ticker).then((response) => {
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

app.post("/create/portfolio", (req, res) => {
    let userID = req.user.user_id;
    let name = req.body.name;
    let cash = req.body.cash;

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

app.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}`);
});
