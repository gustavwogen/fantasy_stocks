\c fantasy_stocks;

INSERT INTO users (username, password, email)
VALUES ('admin', 'adminpassword', 'admin@example.com');

INSERT INTO users (username, password, email)
VALUES ('gustav', 'gustavpassword', 'gustav@example.com');

INSERT INTO users (username, password, email)
VALUES ('filip', 'filippassword', 'filip@example.com');

INSERT INTO users (username, password, email)
VALUES ('andrew', 'andrewpassword', 'andrew@example.com');



INSERT INTO portfolios (user_id, name)
VALUES (1, 'to the moon');

INSERT INTO portfolios (user_id, name)
VALUES (2, 'gustavs portfolio');

INSERT INTO portfolios (user_id, name)
VALUES (3, 'filips portfolio');

INSERT INTO portfolios (user_id, name)
VALUES (4, 'andrews portfolio');



INSERT INTO orders (portfolio_id, order_type, symbol, quantity, unit_price)
VALUES (1, 'BUY', 'AAPL', 10, 140.23);

INSERT INTO orders (portfolio_id, order_type, symbol, quantity, unit_price)
VALUES (1, 'BUY', 'TSLA', 1, 300.4);

INSERT INTO orders (portfolio_id, order_type, symbol, quantity, unit_price)
VALUES (1, 'SELL', 'AAPL', 5, 139.23);

INSERT INTO orders (portfolio_id, order_type, symbol, quantity, unit_price)
VALUES (1, 'SELL', 'GOOG', 5, 139.23);

INSERT INTO orders (portfolio_id, order_type, symbol, quantity, unit_price)
VALUES (2, 'BUY', 'MSFT', 4, 350.4);

INSERT INTO orders (portfolio_id, order_type, symbol, quantity, unit_price)
VALUES (2, 'BUY', 'AMZN', 4, 400.4);

INSERT INTO orders (portfolio_id, order_type, symbol, quantity, unit_price)
VALUES (2, 'BUY', 'SQ', 4, 150.4);

INSERT INTO orders (portfolio_id, order_type, symbol, quantity, unit_price)
VALUES (2, 'BUY', 'TWTR', 4, 50.4);






