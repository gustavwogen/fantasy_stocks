let express = require("express");
let { Pool } = require("pg");
let bcrypt = require("bcrypt");

// Any way to get around this?
let env = require("../env.json");

let hostname = "localhost";
let port = 3000;
let app = express();

app.use(express.json());
app.use(express.static("public"));

let pool = new Pool(env);
pool.connect().then(() => {
    console.log("Connected to database");
});

// https://github.com/kelektiv/node.bcrypt.js#a-note-on-rounds
let saltRounds = 10;

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
                        res.status(200).send();
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

app.get("/", (req, res) => {
    res.redirect('login.html');
})


app.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}`);
});
