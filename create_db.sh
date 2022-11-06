cd sql
for f in *.sql;
do
    echo "Running $f"
    psql --username "$1" -f "$f"
done
