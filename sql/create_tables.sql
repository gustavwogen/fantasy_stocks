DROP DATABASE IF EXISTS fantasy_stocks;
CREATE DATABASE fantasy_stocks;
\c fantasy_stocks;

DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS portfolios;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS users_games;

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
    game_id INT DEFAULT NULL,
    name VARCHAR(50) NOT NULL,
    cash NUMERIC DEFAULT 100000 CHECK (cash >= 0),
    created_at timestamp without time zone default (now() at time zone 'utc'),
    CONSTRAINT fk_user
      FOREIGN KEY(user_id) 
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    portfolio_id INT,
    order_type VARCHAR(5) check (order_type in ('BUY', 'SELL')),
    symbol VARCHAR(20) NOT NULL,
    quantity INT NOT NULL check (quantity > 0),
    unit_price NUMERIC NOT NULL,
    order_date timestamp without time zone default (now() at time zone 'utc'),
    CONSTRAINT fk_portfolio
      FOREIGN KEY(portfolio_id) 
        REFERENCES portfolios(portfolio_id)
        ON DELETE SET NULL
);

CREATE TABLE games (
  game_id SERIAL PRIMARY KEY,
  user_id INT,
  start_date timestamp,
  end_date timestamp check (end_date > start_date),
  start_cash NUMERIC DEFAULT 100000 check (start_cash > 0)
);

CREATE TABLE users_games (
  user_id INT,
  game_id INT,
  CONSTRAINT fk_user
      FOREIGN KEY(user_id) 
        REFERENCES users(user_id)
        ON DELETE SET NULL,
  CONSTRAINT fk_game
      FOREIGN KEY(game_id) 
        REFERENCES games(game_id)
        ON DELETE SET NULL
);