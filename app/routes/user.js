const express = require('express')
const router = express.Router()
let bodyParser = require('body-parser');
let cookieParser = require("cookie-parser");
var multer = require('multer');
var upload = multer();
let bcrypt = require("bcrypt");
const crypto = require('crypto');
const asyncHandler = require('express-async-handler')
require('express-async-errors');
let pool = require('../utils/dbConn');
let db = require('../utils/postgres');

router.use(bodyParser.urlencoded({ extended: true }));
router.use(upload.array()); 
router.use(cookieParser());


router.get("/create", (req, res) => {
    res.render('create_user');
});

// https://github.com/kelektiv/node.bcrypt.js#a-note-on-rounds
let saltRounds = 10;

router.post("/create", (req, res) => {
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

const generateAuthToken = () => {
    return crypto.randomBytes(32).toString('hex');
}

router.get('/login', (req, res) => {
    res.render('login');
});

router.post("/login", asyncHandler(async (req, res) => {
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
            if (user_query.rows.length > 0) {
                var user_id = user_query.rows[0].user_id;
                const authToken = generateAuthToken();
                // Store authentication token
                var authTokens = req.app.get('authTokens');
                authTokens[authToken] = {
                    username: username,
                    user_id: user_id
                };
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

router.get("/logout", (req,res) => {
    let token = req.cookies.AuthToken;
    let authTokens = req.app.get('authTokens');
    delete authTokens[token];
    res.cookie('AuthToken', null);
    res.redirect('/user/login');
});


module.exports = router