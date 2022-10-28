DROP DATABASE IF EXISTS fantasy_stocks;
CREATE DATABASE fantasy_stocks;
\c fantasy_stocks;

DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS portfolios;
DROP TABLE IF EXISTS orders;

CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(25) NOT NULL UNIQUE,
    password CHAR(60) NOT NULL,
    email VARCHAR(40),
    created_at timestamp without time zone default (now() at time zone 'utc')
);

CREATE TABLE IF NOT EXISTS portfolios (
    portfolio_id SERIAL PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    cash NUMERIC DEFAULT 100000,
    created_at timestamp without time zone default (now() at time zone 'utc')
);

CREATE TABLE IF NOT EXISTS orders (
    order_id SERIAL PRIMARY KEY,
    portfolio_id VARCHAR(25) NOT NULL,
    order_type VARCHAR(20) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    quantity INT NOT NULL,
    unit_price NUMERIC NOT NULL,
    order_date timestamp without time zone default (now() at time zone 'utc')
);