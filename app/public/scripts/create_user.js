let usernameInput = document.getElementById("username");
let emailInput = document.getElementById("email");
let passwordInput = document.getElementById("password");
let confirm_password = document.getElementById("confirm-password");
let result = document.getElementById("result");

function validateEmail(email) {
  var re = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
  return re.test(email);
}

document.getElementById("create").addEventListener("click", () => {
	if (passwordInput.value !== confirm_password.value) {
		result.textContent = "Passwords do not match."
		result.classList.add("error");
	} else if (!(validateEmail(emailInput.value))) {
		result.textContent = "Invalid Email."
		result.classList.add("error");
	} else {
		fetch("/signup", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				username: usernameInput.value,
				plaintextPassword: passwordInput.value,
				email: emailInput.value,
			})
		}).then((response) => {
			if (response.status === 200) {
				result.textContent = "Account was created";
				result.classList.remove("error");
			} else {
				response.text().then((text) => {
					result.textContent = text;
				})
				result.classList.add("error");
			}
		});
	}
});