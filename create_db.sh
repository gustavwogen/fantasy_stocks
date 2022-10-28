cd sql
for f in *.sql;
do
    psql --username "$1" -f "$f"
done
