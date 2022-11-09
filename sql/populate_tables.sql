\c fantasy_stocks;

INSERT INTO users (username, password, email)
VALUES ('admin', '$2b$10$hPwYrl2ZwKpLdEjE7T/bNOB2CO0gzWJyvpmdhpNnwo1z0MDynqOiG', 'admin@example.com');

INSERT INTO users (username, password, email)
VALUES ('gustavtest', 'gustavpassword', 'gustav@example.com');

INSERT INTO users (username, password, email)
VALUES ('filiptest', 'filippassword', 'filip@example.com');

INSERT INTO users (username, password, email)
VALUES ('andrewtest', 'andrewpassword', 'andrew@example.com');



INSERT INTO portfolios (user_id, name)
VALUES (1, 'to the moon');

INSERT INTO portfolios (user_id, name)
VALUES (1, '2nd portfolio');

INSERT INTO portfolios (user_id, name)
VALUES (2, 'gustavs portfolio');

INSERT INTO portfolios (user_id, name)
VALUES (3, 'filips portfolio');

INSERT INTO portfolios (user_id, name)
VALUES (4, 'andrews portfolio');


-- Portfolio "to the moon"
INSERT INTO orders (portfolio_id, order_type, symbol, quantity, unit_price)
VALUES (1, 'BUY', 'AAPL', 10, 140.23);

INSERT INTO orders (portfolio_id, order_type, symbol, quantity, unit_price)
VALUES (1, 'BUY', 'TSLA', 1, 300.4);

INSERT INTO orders (portfolio_id, order_type, symbol, quantity, unit_price)
VALUES (1, 'SELL', 'AAPL', 3, 132.23);

INSERT INTO orders (portfolio_id, order_type, symbol, quantity, unit_price)
VALUES (1, 'BUY', 'GOOG', 5, 139.23);

INSERT INTO orders (portfolio_id, order_type, symbol, quantity, unit_price)
VALUES (1, 'SELL', 'AAPL', 1, 139.23);

INSERT INTO orders (portfolio_id, order_type, symbol, quantity, unit_price)
VALUES (1, 'SELL', 'AAPL', 2, 143.23);

INSERT INTO orders (portfolio_id, order_type, symbol, quantity, unit_price)
VALUES (1, 'BUY', 'MMM', 2, 100.23);

INSERT INTO orders (portfolio_id, order_type, symbol, quantity, unit_price)
VALUES (1, 'SELL', 'MMM', 1, 140.23);

INSERT INTO orders (portfolio_id, order_type, symbol, quantity, unit_price)
VALUES (1, 'SELL', 'GOOG', 2, 150);



-- Portfolio "2nd portfolio"
INSERT INTO orders (portfolio_id, order_type, symbol, quantity, unit_price)
VALUES (2, 'BUY', 'MSFT', 4, 350.4);

INSERT INTO orders (portfolio_id, order_type, symbol, quantity, unit_price)
VALUES (2, 'BUY', 'AMZN', 4, 400.4);

INSERT INTO orders (portfolio_id, order_type, symbol, quantity, unit_price)
VALUES (2, 'BUY', 'SQ', 4, 150.4);

INSERT INTO orders (portfolio_id, order_type, symbol, quantity, unit_price)
VALUES (2, 'BUY', 'TWTR', 4, 50.4);

INSERT INTO orders (portfolio_id, order_type, symbol, quantity, unit_price)
VALUES (1, 'BUY', 'AAPL', 3, 157.23);

INSERT INTO orders (portfolio_id, order_type, symbol, quantity, unit_price)
VALUES (2, 'BUY', 'TWTR', 4, 50.4);

INSERT INTO orders (portfolio_id, order_type, symbol, quantity, unit_price)
VALUES (2, 'SELL', 'AMZN', 2, 450.4);




