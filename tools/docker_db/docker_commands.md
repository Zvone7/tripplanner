## build DB docker image

> docker build -t testdb_tripplanner . -f testdb_tripplanner.dockerfile

## run DB in docker

> docker run -p 1433:1433 -d --name=sql_testdb_tp testdb_tripplanner