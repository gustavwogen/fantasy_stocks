const axios = require('axios');

let env = require("../../env.json");
let apiKey = env.apiKey;

const baseUrl = "https://sandbox.iexapis.com/stable"

exports.getQuotes = async (symbols) => {
    try {
        let endpoint = `stock/market/batch/`
        query = `?token=${apiKey}&symbols=${symbols}&types=quote&displayPercent=true`
        let url = `${baseUrl}/${endpoint}${query}`
        const response = await axios.get(url);
        return response;
    } catch (err) {
        // Handle Error Here
        return err.response;
    }
};

exports.getQuote = async (symbol) => {
    try {
        let endpoint = `stock/${symbol}/quote`
        query = `?token=${apiKey}&displayPercent=true`
        let url = `${baseUrl}/${endpoint}${query}`
        const response = await axios.get(url);
        return response;
    } catch (err) {
        // Handle Error Here
        return err.response;
    }
};

exports.getPrices = async (symbols) => {
    try {
        let endpoint = "stock/market/batch"
        query = `?token=${apiKey}&symbols=${symbols}&types=price`
        let url = `${baseUrl}/${endpoint}${query}`
        const response = await axios.get(url);
        return response;
    } catch (err) {
        // Handle Error Here
        return err.response;
    }
};