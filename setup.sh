npm install

read -p "Enter postgres username: " username

read -sp "Password for user $username: " password
export PGPASSWORD=$password

bash create_db.sh $username

echo "Connecting to server..."
node app/server.js