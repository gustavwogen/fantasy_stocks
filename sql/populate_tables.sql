\c fantasy_stocks;

INSERT INTO users (username, password, email)
VALUES ('admin', 'adminpassword', 'admin@example.com');




INSERT INTO portfolios (user_id, name)
VALUES (1, 'to the moon');



INSERT INTO orders (portfolio_id, order_type, symbol, quantity, unit_price)
VALUES (1, 'BUY', 'AAPL', 10, 140.23);


INSERT INTO orders (portfolio_id, order_type, symbol, quantity, unit_price)
VALUES (1, 'BUY', 'TSLA', 1, 300.4);

