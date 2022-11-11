\c fantasy_stocks;

INSERT INTO users (username, password, email)
VALUES 
('admin', '$2b$10$hPwYrl2ZwKpLdEjE7T/bNOB2CO0gzWJyvpmdhpNnwo1z0MDynqOiG', 'admin@example.com'),
('gustavtest', 'gustavpassword', 'gustav@example.com'),
('filiptest', 'filippassword', 'filip@example.com'),
('andrewtest', 'andrewpassword', 'andrew@example.com')
;


INSERT INTO portfolios (user_id, name)
VALUES 
(1, 'to the moon'),
(1, '2nd portfolio'),
(2, 'gustavs portfolio'),
(3, 'filips portfolio'),
(4, 'andrews portfolio');


-- Portfolio "to the moon"
INSERT INTO orders 
(portfolio_id, order_type, symbol, quantity, unit_price)
VALUES 
(1, 'BUY', 'AAPL', 10, 140.23),
(1, 'BUY', 'TSLA', 1, 300.4),
(1, 'SELL', 'AAPL', 3, 132.23),
(1, 'BUY', 'GOOG', 5, 139.23),
(1, 'SELL', 'AAPL', 1, 139.23),
(1, 'SELL', 'AAPL', 2, 143.23),
(1, 'BUY', 'MMM', 2, 100.23),
(1, 'SELL', 'MMM', 1, 140.23),
(1, 'SELL', 'GOOG', 2, 150),
(1, 'SELL', 'GOOG', 2, 142)
;

-- Portfolio "2nd portfolio"
INSERT INTO orders 
(portfolio_id, order_type, symbol, quantity, unit_price)
VALUES 
(2, 'BUY', 'MSFT', 4, 350.4),
(2, 'BUY', 'AMZN', 4, 400.4),
(2, 'BUY', 'SQ', 4, 150.4),
(1, 'BUY', 'AAPL', 3, 157.23),
(2, 'SELL', 'AMZN', 2, 450.4)
;


INSERT INTO games
(user_id, start_date, end_date)
values 
(1, now() at time zone 'utc', (now() + interval '1 month') at time zone 'utc');


INSERT INTO users_games(user_id, game_id)
values (1, 1);