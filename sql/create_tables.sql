DROP DATABASE IF EXISTS fantasy_stocks;
CREATE DATABASE fantasy_stocks;
\c fantasy_stocks;

DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS portfolios;
DROP TABLE IF EXISTS orders;

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(25) NOT NULL UNIQUE,
    password CHAR(60) NOT NULL,
    email VARCHAR(40),
    created_at timestamp without time zone default (now() at time zone 'utc') 
);

CREATE TABLE portfolios (
    portfolio_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    cash NUMERIC DEFAULT 100000,
    created_at timestamp without time zone default (now() at time zone 'utc'),
    CONSTRAINT fk_user
      FOREIGN KEY(user_id) 
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    portfolio_id INT,
    order_type VARCHAR(20) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    quantity INT NOT NULL,
    unit_price NUMERIC NOT NULL,
    order_date timestamp without time zone default (now() at time zone 'utc'),
    CONSTRAINT fk_portfolio
      FOREIGN KEY(portfolio_id) 
        REFERENCES portfolios(portfolio_id)
        ON DELETE SET NULL
);

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