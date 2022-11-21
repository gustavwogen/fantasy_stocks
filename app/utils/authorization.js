const portfolio = (req, res, next) => {
    let portfolioId = req.params.portfolioId;

    if (!req.user.portfolios || !req.user.portfolios[portfolioId]) {
        res.sendStatus(401);
    } else {
        next();
    }
};

const game = (req, res, next) => {
    let gameId = req.params.gameId;
    
    if (!req.user.games || !req.user.games[gameId]) {
        res.sendStatus(401);
    } else {
        next();
    }
};

module.exports = {
    portfolio,
    game
};