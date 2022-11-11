read -p "Enter postgres username: " username
export POSTGRES_USER=$username

read -sp "Password for user $username: " password
export PGPASSWORD=$password

cd sql
for f in *.sql;
do
    echo "Running $f"
    psql -U $POSTGRES_USER -f "$f"
done
