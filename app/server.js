let express = require("express");
let pool = require('./utils/dbConn')
let cookieParser = require("cookie-parser");
let bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();
let sessions = require('express-session');
const path = require('path')
const asyncHandler = require('express-async-handler')
require('express-async-errors');


// Routes
const user = require('./routes/user');
const portfolio = require('./routes/portfolio');
const game = require('./routes/game');


let iex = require('./utils/iex');
let db = require('./utils/postgres');

let env = require("../env.json");

let hostname = "localhost";
let port = 3000;
let app = express();


app.set(path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('authTokens', {});


// creating 24 hours from milliseconds
const oneDay = 1000 * 60 * 60 * 24;

//session middleware
app.use(sessions({
    // change this value later
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false
}));

function logger(req, res, next) {
    console.log("URL: " + req.url);
    next();
};

app.use(logger);

// cookie parser middleware
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true })); 

app.use(upload.array()); 

app.use((req, res, next) => {
    // Get auth token from the cookies
    const authToken = req.cookies['AuthToken'];

    // Inject the user to the request
    var authTokens = req.app.get('authTokens');
    req.user = authTokens[authToken];
    res.locals.user = req.user;

    // if (req.user) {
    //     console.log("user", req.user);
    //     console.log("MyPortfolio", req.user.portfolios);
    //     console.log("MyGames", req.user.games);
    // }

    // for testing
//     req.user = {
//         username: 'admin',
//         user_id: 1,
//         portfolios: {
//           '1': {
//             portfolio_id: 1,
//             user_id: 1,
//             name: 'to the moon',
//             cash: '63219.29',
//             created_at: "2022-11-13T04:19:18.119Z"
//           },
//           '2': {
//             portfolio_id: 2,
//             user_id: 1,
//             name: '2nd portfolio',
//             cash: '100000',
//             created_at: "2022-11-13T04:19:18.119Z"
//           }
//         },
//         games: {
//             '1': {
//                 game_id: 1,
//                 name: "First Game"
//             },
//             '2': {
//                 game_id: 2,
//                 name: "Sedcond Game"
//             }
//         } 
//       }
//     // for testing
    // res.locals.user = {
    //     username: 'admin',
    //     user_id: 1,
    //     portfolios: {
    //         '1': {
    //         portfolio_id: 1,
    //         user_id: 1,
    //         game_id: 1,
    //         name: 'to the moon',
    //         cash: '67486.910000000002',
    //         created_at: "2022-11-15T04:44:54.388Z"
    //         },
    //         '2': {
    //         portfolio_id: 2,
    //         user_id: 1,
    //         game_id: 2,
    //         name: '2nd portfolio',
    //         cash: '70267.2',
    //         created_at: "2022-11-15T04:44:54.388Z"
    //         },
    //         '8': {
    //         portfolio_id: 8,
    //         user_id: 1,
    //         game_id: 10,
    //         name: 'Finally fixed admin',
    //         cash: '99000',
    //         created_at: "2022-11-15T05:06:02.907Z"
    //         },
    //         '9': {
    //         portfolio_id: 9,
    //         user_id: 1,
    //         game_id: 14,
    //         name: 'game23 admin',
    //         cash: '88000',
    //         created_at: "2022-11-15T05:18:40.564Z"
    //         },
    //         '10': {
    //         portfolio_id: 10,
    //         user_id: 1,
    //         game_id: 15,
    //         name: 'game24 admin',
    //         cash: '55555',
    //         created_at: "2022-11-15T05:36:19.471Z"
    //         },
    //         '11': {
    //         portfolio_id: 11,
    //         user_id: 1,
    //         game_id: 16,
    //         name: 'game25 admin',
    //         cash: '65000',
    //         created_at: "2022-11-15T05:38:57.662Z"
    //         },
    //         '14': {
    //         portfolio_id: 14,
    //         user_id: 1,
    //         game_id: 17,
    //         name: 'gameFail admin',
    //         cash: '54321',
    //         created_at: "2022-11-15T05:50:12.957Z"
    //         },
    //         '15': {
    //         portfolio_id: 15,
    //         user_id: 1,
    //         game_id: 18,
    //         name: 'game30 admin',
    //         cash: '125000',
    //         created_at: "2022-11-15T22:11:17.285Z"
    //         },
    //         '18': {
    //         portfolio_id: 18,
    //         user_id: 1,
    //         game_id: null,
    //         name: 'pugGame',
    //         cash: '124000',
    //         created_at: "2022-11-15T22:33:36.211Z"
    //         },
    //         '19': {
    //         portfolio_id: 19,
    //         user_id: 1,
    //         game_id: null,
    //         name: '',
    //         cash: '23',
    //         created_at: "2022-11-15T22:34:22.275Z"
    //         },
    //         '20': {
    //         portfolio_id: 20,
    //         user_id: 1,
    //         game_id: 19,
    //         name: 'Fun game admin',
    //         cash: '12000',
    //         created_at: "2022-11-16T01:51:14.896Z"
    //         },
    //         '23': {
    //         portfolio_id: 23,
    //         user_id: 1,
    //         game_id: null,
    //         name: 'portfolio for id=5',
    //         cash: '69000',
    //         created_at: "2022-11-16T01:58:07.773Z"
    //         },
    //         '24': {
    //         portfolio_id: 24,
    //         user_id: 1,
    //         game_id: null,
    //         name: 'not ID 1',
    //         cash: '420000',
    //         created_at: "2022-11-16T02:08:12.108Z"
    //         },
    //         '25': {
    //         portfolio_id: 25,
    //         user_id: 1,
    //         game_id: null,
    //         name: 'newOne',
    //         cash: '1234',
    //         created_at: "2022-11-16T02:11:08.692Z"
    //         },
    //         '43': {
    //         portfolio_id: 43,
    //         user_id: 1,
    //         game_id: 25,
    //         name: 'bootstrap game admin',
    //         cash: '123000',
    //         created_at:" 2022-11-16T20:00:37.053Z"
    //         },
    //         '44': {
    //         portfolio_id: 44,
    //         user_id: 1,
    //         game_id: null,
    //         name: "hatti's portfolio",
    //         cash: '10000000',
    //         created_at: "2022-11-19T03:32:59.987Z"
    //         },
    //         '45': {
    //         portfolio_id: 45,
    //         user_id: 1,
    //         game_id: 26,
    //         name: 'hattis game admin',
    //         cash: '123456',
    //         created_at: "2022-11-19T03:33:32.802Z"
    //         }
    //     },
    //     games: {
    //         '1': {
    //         game_id: 1,
    //         user_id: 1,
    //         game_name: null,
    //         start_date: "2022-11-15T04:44:54.393Z",
    //         end_date: "2022-12-15T04:44:54.393Z",
    //         start_cash: '100000'
    //         },
    //         '2': {
    //         game_id: 2,
    //         user_id: 1,
    //         game_name: 'newGame',
    //         start_date: null,
    //         end_date: null,
    //         start_cash: '87000'
    //         },
    //         '3': {
    //         game_id: 3,
    //         user_id: 1,
    //         game_name: 'filips game',
    //         start_date: null,
    //         end_date: null,
    //         start_cash: '98000'
    //         },
    //         '4': {
    //         game_id: 4,
    //         user_id: 1,
    //         game_name: 'game2',
    //         start_date: null,
    //         end_date: null,
    //         start_cash: '123456'
    //         },
    //         '5': {
    //         game_id: 5,
    //         user_id: 1,
    //         game_name: 'helloThere',
    //         start_date: null,
    //         end_date: null,
    //         start_cash: '65000'
    //         },
    //         '6': {
    //         game_id: 6,
    //         user_id: 1,
    //         game_name: 'What is up',
    //         start_date: null,
    //         end_date: null,
    //         start_cash: '78000'
    //         },
    //         '7': {
    //         game_id: 7,
    //         user_id: 1,
    //         game_name: 'newGame22',
    //         start_date: null,
    //         end_date: null,
    //         start_cash: '222222'
    //         },
    //         '8': {
    //         game_id: 8,
    //         user_id: 1,
    //         game_name: 'NOWWW',
    //         start_date: null,
    //         end_date: null,
    //         start_cash: '12345'
    //         },
    //         '9': {
    //         game_id: 9,
    //         user_id: 1,
    //         game_name: 'This works',
    //         start_date: null,
    //         end_date: null,
    //         start_cash: '12555'
    //         },
    //         '10': {
    //         game_id: 10,
    //         user_id: 1,
    //         game_name: 'Finally fixed',
    //         start_date: null,
    //         end_date: null,
    //         start_cash: '99000'
    //         },
    //         '11': {
    //         game_id: 11,
    //         user_id: 1,
    //         game_name: 'game123',
    //         start_date: null,
    //         end_date: null,
    //         start_cash: '92000'
    //         },
    //         '12': {
    //         game_id: 12,
    //         user_id: 1,
    //         game_name: 'game21',
    //         start_date: null,
    //         end_date: null,
    //         start_cash: '50000'
    //         },
    //         '13': {
    //         game_id: 13,
    //         user_id: 1,
    //         game_name: 'game22',
    //         start_date: null,
    //         end_date: null,
    //         start_cash: '45000'
    //         },
    //         '14': {
    //         game_id: 14,
    //         user_id: 1,
    //         game_name: 'game23',
    //         start_date: "2022-11-15T05:18:40.539Z",
    //         end_date: "2022-12-15T05:18:40.539Z",
    //         start_cash: '88000'
    //         },
    //         '15': {
    //         game_id: 15,
    //         user_id: 1,
    //         game_name: 'game24',
    //         start_date: "2022-11-15T05:36:19.464Z",
    //         end_date: "2022-12-15T05:36:19.464Z",
    //         start_cash: '55555'
    //         },
    //         '16': {
    //         game_id: 16,
    //         user_id: 1,
    //         game_name: 'game25',
    //         start_date: "2022-11-15T05:38:57.657Z",
    //         end_date: "2022-12-15T05:38:57.657Z",
    //         start_cash: '67700'
    //         },
    //         '17': {
    //         game_id: 17,
    //         user_id: 1,
    //         game_name: 'gameFail',
    //         start_date: "2022-11-15T05:50:12.950Z",
    //         end_date: "2022-12-15T05:50:12.950Z",
    //         start_cash: '54321'
    //         },
    //         '18': {
    //         game_id: 18,
    //         user_id: 1,
    //         game_name: 'game30',
    //         start_date: "2022-11-15T22:11:17.280Z",
    //         end_date: "2022-12-15T22:11:17.280Z",
    //         start_cash: '125000'
    //         },
    //         '19': {
    //         game_id: 19,
    //         user_id: 1,
    //         game_name: 'Fun game',
    //         start_date: "2022-11-16T01:51:14.893Z",
    //         end_date: "2022-12-16T01:51:14.893Z",
    //         start_cash: '12000'
    //         },
    //         '26': {
    //         game_id: 26,
    //         user_id: 1,
    //         game_name: 'hattis game',
    //         start_date: "2022-11-19T03:33:32.797Z",
    //         end_date: "2022-12-19T03:33:32.797Z",
    //         start_cash: '123456'
    //         }
    //     }
    // }
    next();
});


app.use(express.json());
app.use(express.static('public'));

app.use("/user", user);
app.use("/portfolio", portfolio);
app.use("/game", game);

function requireAuth(req, res, next) {
    console.log('requireAuth');
    if (req.user) {
        next();
    } else {
        console.log("Redirecting to /user/login");
        res.redirect('/user/login');
    }
};

app.use(requireAuth); // user will need to be logged in to access any route under this line 


app.get("/", (req, res) => {
    let user = req.user;
    // we can access the username of the currently logged in user this way
    // lets us query data from the database
    // console.log(res.locals.user);
    res.render('index');
    // res.sendFile('public/index.html', {root: __dirname})
})

app.get("/search", asyncHandler(async (req, res) => {
    if (!req.query.ticker) {
        res.render("search_bootstrap");
    } else {
        let ticker = req.query.ticker;
        let iexResponse = await iex.getQuotes(ticker);
        if (200 <= iexResponse.status && iexResponse.status <= 299) {
            res.render("search_bootstrap", iexResponse.data[ticker.toUpperCase()]['quote']);
        }  else {
            console.log(iexResponse.status);
            res.status(iexResponse.status)
            res.render('search_bootstrap', {error: iexResponse.data});
        }
    }
}));

// Post Quote - 1 ticker
app.post("/quote", (req, res) => {
    if (req.body.symbol) {
        let ticker = req.body.symbol;
        iex.getQuote(ticker).then((response) => {
            if (response.status === 200) {
                var data = response.data;
                return res.json(data);
            } else {
                return res.status(response.status).json({data: response.data})
            }
        }).catch((error) => {
            console.log(error);
        });
    }
});

// Get quote - Multiple tickers
app.get("/quote", asyncHandler(async (req, res) => {
    let tickers= req.query.symbol;
    let response = await iex.getQuotes(tickers)
    res.json(response.data);
}))

// Get Price - 1 ticker
app.get("/price", (req, res) => {
    let ticker = req.query.symbol;
    iex.getQuote(ticker).then((response) => {
        if (response.status === 200) {
            //console.log(data);
            var data = response.data;
            res.json(data);
        } else {
            console.log("Message: " + response.data.error);
        }
    }).catch((error) => {
        console.log(error);
    });
})

app.get("/placeOrder", asyncHandler(async (req, res) => {
    let ticker = req.query.symbol.toUpperCase();
    let orderType = req.query.orderType.toUpperCase();
    let quantity = Number(req.query.quantity);
    let portfolioId = Number(req.query.portfolioId);
    let price = Number(req.query.price);

    let cashResponse = await db.getCash(pool, portfolioId);
    let currentCash = Number(cashResponse[0].cash);
    totalValue = quantity*price;
    let run = false;

    let quantityResponse = await db.getQuantity(pool, portfolioId, ticker);
    let totalQuantity = Number(quantityResponse[0].quantity);

    console.log(`${totalValue} < ${currentCash}`);
    console.log(`${quantity} < ${totalQuantity}`);

    if ((orderType === 'BUY') && (currentCash > totalValue)) {
        db.buyOrderCash(pool, totalValue, portfolioId);
        run = true;
    } else if ((orderType === 'SELL') && (quantity < totalQuantity)) {
        db.sellOrderCash(pool, totalValue, portfolioId);
        run = true
    } else if ((orderType === 'BUY') && (currentCash < totalValue)) {
        console.log("Not enough cash");
        return res.json("Not enough cash");
    } else if ((orderType === 'SELL') && (quantity > totalQuantity)) {
        console.log("Do not own required quantity");
        return res.json("Do not own required quantity");
    }

    if (run) {
        console.log(ticker, orderType, quantity, portfolioId, price);
        pool.query(`
            INSERT INTO orders (portfolio_id, order_type, symbol, quantity, unit_price) 
            VALUES ($1, $2, $3, $4, $5);`,
            [portfolioId, orderType, ticker, quantity, price]
        ).then(result => {
            return res.json(result);
        });
    }
}))

app.get("/cash", (req, res) => {
    let portfolioId = req.query.portfolioId;
    pool.query(`
        SELECT portfolio_id, cash from portfolios where portfolio_id=$1`,
        [portfolioId]
    ).then(result => {
        return res.json(result);
    });
})

app.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}`);
});
