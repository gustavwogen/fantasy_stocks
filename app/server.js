let express = require("express");
let { Pool } = require("pg");
let bcrypt = require("bcrypt");
const crypto = require('crypto');
let cookieParser = require("cookie-parser");
let sessions = require('express-session');

const {getQuote} = require('./utils/iex');

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

// cookie parser middleware
app.use(cookieParser());

app.use((req, res, next) => {
    // Get auth token from the cookies
    const authToken = req.cookies['AuthToken'];

    // Inject the user to the request
    req.user = authTokens[authToken];
    console.log('custom middleware');
    next();
});

app.use(express.json());
app.use(express.static("public"));

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

                        res.cookie('loggedIn', true);
                        return res.redirect("/");
                    } else {
                         res.status(401).send();
                    }
                })
                .catch((error) => {
                    // bcrypt crashed
                    console.log(error);
                    res.status(500).send();
                });
        })
        .catch((error) => {
            // select crashed
            console.log(error);
            res.status(500).send();
        });
});

const requireAuth = (req, res, next) => {
    if (req.user) {
        console.log('requireAuth logged in');
        next();
    } else {
        console.log('requireAuth not logged in');
        res.redirect('/user/login');
    }
};

app.get("/", requireAuth, (req, res) => {
    let user = req.user; 
    // we can access the username of the currently logged in user this way
    // lets us query data from the database
    console.log(user);
    res.sendFile('public/index_test.html' , { root : __dirname});
})

app.get('/user/login', function (req, res) {
    res.sendFile('public/login.html' , { root : __dirname});
});

app.get("/user/logout", (req,res) => {
    res.cookie('loggedIn', false);
    res.cookie('AuthToken', 'None')
    res.redirect('/user/login');
});

app.get("/user/create", (req, res) => {
    res.sendFile('public/create.html' , { root : __dirname});
});


app.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}`);
});
