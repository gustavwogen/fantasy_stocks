const axios = require('axios');

let env = require("../../env.json");
let apiKey = env.apiKey;

const baseUrl = "https://sandbox.iexapis.com/stable"

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

// getQuote('msft').then((response) => {
//     if (response.status === 200) {
//         var data = response.data;
//         console.log(data);
//     } else {
//         console.log("Message: " + response.data.error);
//     }
// }).catch((error) => {
//     console.log(error);
// });
