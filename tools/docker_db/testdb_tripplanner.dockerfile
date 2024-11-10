FROM mcr.microsoft.com/azure-sql-edge AS build

USER root

RUN apt-get update && apt-get install -y python3 python3-pip curl unixodbc-dev

RUN pip3 install pyodbc

RUN pip3 install pyodbc

COPY ./sql/ /sql/

COPY run_sql_scripts.py /run_sql_scripts.py

ENV SA_PASSWORD "MyPass@word"

EXPOSE 1433

ENV ACCEPT_EULA "Y"

RUN /opt/mssql/bin/sqlservr & sleep 20 && python3 /run_sql_scripts.py



CMD /opt/mssql/bin/sqlservr