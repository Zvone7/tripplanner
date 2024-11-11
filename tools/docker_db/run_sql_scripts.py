import pyodbc
import time

conn_str = (
    r"Driver={ODBC Driver 17 for SQL Server};"
    r"Server=localhost;"
    r"Database=master;"
    r"UID=sa;"
    r"PWD=MyPass@word;" 
)
conn = pyodbc.connect(conn_str, timeout=300)
cursor = conn.cursor()

sql_files = [
    "/sql/1_Trip.sql",
    "/sql/2_TripOption.sql",
    "/sql/3_SegmentType.sql",
    "/sql/4_Segment.sql",
    "/sql/5_OptionToSegment.sql",
    "/sql/99_setup.sql"
]

for sql_file in sql_files:
    with open(sql_file, 'r') as f:
        sql_command = f.read()
        cursor.execute(sql_command)
        cursor.commit()

cursor.close()
conn.close()
