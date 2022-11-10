let button = document.getElementById('search-button');
const form = document.getElementById('form');

form.addEventListener('submit', (event) => {
    let ticker = form.elements['ticker'].value;
    fetch("/quote", {
        method: 'POST',
        body: JSON.stringify({symbol: ticker}),
        headers: {
            "Content-Type": "application/json"
        }
    }).then((response) => {
        if (response.ok) {
            response.json().then((body) => {
                console.log(body);
                document.getElementById("successful-search").style.display = "initial";
                document.getElementById("error-message").style.display = "none";
                let company = document.getElementById('company-name');
                company.textContent = `${body.companyName} (${body.symbol})`;
                let price = document.getElementById('price');
                price.textContent = (Math.round(body.latestPrice * 100) / 100).toFixed(2);

                let change_price = document.getElementById('change-price');
                change_price.textContent = body.change
                if (body.change > 0) {
                    change_price.style.color = "green";
                } else if (body.change < 0) {
                    change_price.style.color = "red";
                }

                let change_percent = document.getElementById("change-percent");
                change_percent.textContent = `(${body.changePercent.toFixed(2)}%)`;
                if (body.changePercent > 0) {
                    change_percent.style.color = "green";
                } else if (body.changePercent < 0) {
                    change_percent.style.color = "red";
                }
            });
        } else {
            response.json().then((errorBody) => {
                document.getElementById("sucessful-search").style.display = "none";
                document.getElementById("error-message").style.display = "initial";
                let errorDiv = document.getElementById("error-message");
                errorDiv.textContent = errorBody.data;
                errorDiv.style.color = "red";
            })
        }
    }).catch((error) => {console.log(error)});
    event.preventDefault(); // why do we need this?
});