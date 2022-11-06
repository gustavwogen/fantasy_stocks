# Fantasy Stocks

Run `npm start` to install all dependencies, run the database setup, and start the local server.

### Database setup:

- Make sure you have **PostgresSQL** installed on your computer
- Create an environmental variable called POSTGRES_USER which contains the username you want to use

    - To create an environmental variable in Bash you can use the `export` keyword like this: `export POSTGRES_USER="<username>"`

- Run `npm run-script setup_sql`. This will:

	- Create necessary database tables for our application
	- Populate those tables with dummy data

- Run `npm install` to install all packages required

- Open the env.json file and type in your username and password
