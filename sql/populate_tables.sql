\c fantasy_stocks;

INSERT INTO users (username, password, email)
VALUES 
('admin', '$2b$10$hPwYrl2ZwKpLdEjE7T/bNOB2CO0gzWJyvpmdhpNnwo1z0MDynqOiG', 'admin@example.com'),
('gustavtest', 'gustavpassword', 'gustav@example.com'),
('filiptest', 'filippassword', 'filip@example.com'),
('andrewtest', 'andrewpassword', 'andrew@example.com')
;


INSERT INTO portfolios (user_id, name, game_id)
VALUES 
(1, 'to the moon', null),
(1, '2nd portfolio', null),
(2, 'gustavs portfolio', null),
(3, 'filips portfolio', null),
(4, 'andrews portfolio', null);

UPDATE portfolios SET game_id=1 WHERE portfolio_id=1;
-- UPDATE portfolios SET game_id=2 WHERE portfolio_id=2;

-- Portfolio "to the moon"
INSERT INTO orders 
(portfolio_id, order_type, symbol, quantity, unit_price)
VALUES 
(1, 'BUY', 'AAPL', 40, 100.23),
(1, 'BUY', 'TSLA', 10, 40.4),
(1, 'BUY', 'MMM', 300, 100.23),
(1, 'BUY', 'GOOG', 5, 139.23),
(1, 'BUY', 'GOOG', 40, 80.23),
(1, 'SELL', 'AAPL', 3, 132.23),
(1, 'SELL', 'AAPL', 1, 139.23),
(1, 'SELL', 'AAPL', 2, 143.23),
(1, 'SELL', 'GOOG', 2, 150),
(1, 'SELL', 'GOOG', 2, 142),
(1, 'SELL', 'MMM', 2, 100.23)
;

UPDATE portfolios SET cash = cash - (
    select
    sum((case when order_type = 'BUY' then 1 else -1 end) * quantity * unit_price) as total
    from orders
    where portfolio_id=1
)
where portfolio_id=1;

-- Portfolio "2nd portfolio"
INSERT INTO orders 
(portfolio_id, order_type, symbol, quantity, unit_price)
VALUES 
(2, 'BUY', 'MSFT', 40, 350.4),
(2, 'BUY', 'AMZN', 40, 400.4),
(2, 'BUY', 'SQ', 4, 150.4),
(1, 'BUY', 'AAPL', 3, 157.23),
(2, 'SELL', 'AMZN', 2, 450.4)
;

-- Update portfolio 2 cash
UPDATE portfolios SET cash = cash - (
    select
    sum((case when order_type = 'BUY' then 1 else -1 end) * quantity * unit_price) as total
    from orders
    where portfolio_id=2
)
where portfolio_id=2;


INSERT INTO games
(user_id, game_name, start_date, end_date)
values 
(1, 'first game', now() at time zone 'utc', (now() + interval '1 month') at time zone 'utc');


INSERT INTO users_games(user_id, game_id)
values (1, 1);