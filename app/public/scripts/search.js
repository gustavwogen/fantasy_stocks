let buyButton = document.getElementById('buyButton');
let sellButton = document.getElementById('sellButton');


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
                let div = document.getElementById('successfulOrder');
                if (quantity > 1) {
                    div.textContent = `You successfully purchased ${quantity} shares of ${symbol}`;
                } else {
                    div.textContent = `You successfully purchased ${quantity} share of ${symbol}`;
                }
                div.style.display = 'block';    
            })
        }
    })
});

sellButton.addEventListener("click", () => {
    let quantity = document.getElementById('quantityBuy').value;
    let unitPrice = document.getElementById('latestPrice').textContent;
    let symbol = document.getElementById('buyModalTitle').textContent.slice(4);
    let orderType = 'SELL';
    let portfolioId = 1;
    let query = `symbol=${symbol}&orderType=${orderType}&portfolioId=${portfolioId}&price=${unitPrice}&quantity=${quantity}`

    fetch(`/placeOrder?${query}`).then((response) => {
        if (response.ok) {
            response.json().then((data) => {
                let div = document.getElementById('successfulOrder');
                if (quantity > 1) {
                    div.textContent = `You successfully sold ${quantity} shares of ${symbol}`;
                } else {
                    div.textContent = `You successfully sold ${quantity} share of ${symbol}`;
                }
                div.style.display = 'block';    
            })
        }
    })
});