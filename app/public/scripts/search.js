let buyButton = document.getElementById('buyButton');
let sellButton = document.getElementById('sellButton');

if (buyButton) {
    buyButton.addEventListener("click", () => {
        let quantity = document.getElementById('quantityBuy').value;
        let unitPrice = document.getElementById('latestPrice').textContent;
        let symbol = document.getElementById('buyModalTitle').textContent.slice(4);
        let orderType = 'BUY';
        let portfolioId = 1;
        let query = `symbol=${symbol}&orderType=${orderType}&portfolioId=${portfolioId}&price=${unitPrice}&quantity=${quantity}`
    
        fetch(`/placeOrder?${query}`).then((response) => {
            if (response.ok) {
                response.json().then((data) => {
                    console.log(data);
                    let div = document.getElementById('successfulOrder');
                    if (data === "Not enough cash") {
                        div.textContent = "Error: Not enough cash to complete transactions";
                        //div.color = "red";
                    } else if (quantity > 0) {
                        div.textContent = `You successfully purchased ${quantity} shares of ${symbol}`;
                    } else {
                        div.textContent = `You successfully purchased ${quantity} share of ${symbol}`;
                    }
                    div.style.display = 'block';    
                })
            }
        })
    });
}

if (sellButton) {
    sellButton.addEventListener("click", () => {
        let quantity = document.getElementById('quantitySell').value;
        let unitPrice = document.getElementById('latestPrice').textContent;
        let symbol = document.getElementById('buyModalTitle').textContent.slice(4);
        let orderType = 'SELL';
        let portfolioId = 1;
        let query = `symbol=${symbol}&orderType=${orderType}&portfolioId=${portfolioId}&price=${unitPrice}&quantity=${quantity}`
        console.log(quantity);
        fetch(`/placeOrder?${query}`).then((response) => {
            if (response.ok) {
                response.json().then((data) => {
                    let div = document.getElementById('successfulOrder');
                    console.log(data);
                    if (data === "Do not own required quantity") {
                        div.textContent = "Do not own required quantity"
                    } else if (quantity > 0) {
                        div.textContent = `You successfully sold ${quantity} shares of ${symbol}`;
                    } else {
                        div.textContent = `You successfully sold ${quantity} share of ${symbol}`;
                    }
                    div.style.display = 'block';    
                })
            }
        })
    });
}