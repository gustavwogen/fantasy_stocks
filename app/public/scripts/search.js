let buyButton = document.getElementById('buyButton');
let sellButton = document.getElementById('sellButton');

if (buyButton) {
    buyButton.addEventListener("click", () => {
        let quantity = document.getElementById('quantityBuy').value;
        let unitPrice = document.getElementById('latestPrice').textContent;
        let symbol = document.getElementById('buyModalTitle').textContent.slice(4);
        let orderType = 'BUY';
        let portfolioId = document.getElementById("exampleFormControlSelect1").value;
        let query = `symbol=${symbol}&orderType=${orderType}&portfolioId=${portfolioId}&price=${unitPrice}&quantity=${quantity}`
    
        fetch(`/placeOrder?${query}`).then((response) => {
            if (response.ok) {
                response.json().then((data) => {
                    console.log(data);
                    let divSuccess = document.getElementById('successfulOrder');
                    let divError = document.getElementById('failedOrder');
                    if (data === "Not enough cash") {
                        divError.textContent = "Error: Not enough cash to complete transactions";
                        divError.style.display = 'block'; 
                    } else if (data === "Game Finished") {
                        divError.textContent = "Error: Game is finished";
                        divError.style.display = 'block'; 
                    } else if (quantity > 0) {
                        divSuccess.textContent = `You successfully purchased ${quantity} shares of ${symbol}`;
                        divSuccess.style.display = 'block'; 
                    } else {
                        divSuccess.textContent = `You successfully purchased ${quantity} share of ${symbol}`;
                        divSuccess.style.display = 'block'; 
                    }
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
        let portfolioId = document.getElementById("exampleFormControlSelect2").value;
        let query = `symbol=${symbol}&orderType=${orderType}&portfolioId=${portfolioId}&price=${unitPrice}&quantity=${quantity}`
        console.log(quantity);
        fetch(`/placeOrder?${query}`).then((response) => {
            if (response.ok) {
                response.json().then((data) => {
                    let divSuccess = document.getElementById('successfulOrder');
                    let divError = document.getElementById('failedOrder');
                    console.log(data);
                    if (data === "Do not own required quantity") {
                        divError.textContent = "Error: Do not own required quantity"
                        divError.style.display = 'block';  
                    } else if (data === "Game Finished") {
                        divError.textContent = "Error: Game is finished";
                        divError.style.display = 'block';  
                    } else if (quantity > 0) {
                        divSuccess.textContent = `You successfully sold ${quantity} shares of ${symbol}`;
                        divSuccess.style.display = 'block';
                    } else {
                        divSuccess.textContent = `You successfully sold ${quantity} share of ${symbol}`;
                        divSuccess.style.display = 'block';
                    }
                })
            }
        })
    });
}