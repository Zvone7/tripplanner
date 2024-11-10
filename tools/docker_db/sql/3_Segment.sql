
CREATE TABLE segment (
    id INT PRIMARY KEY IDENTITY,
    trip_id INT,
    start_time DATETIME,
    end_time DATETIME,
    nickname NVARCHAR(255),
    cost DECIMAL(10, 2),
    FOREIGN KEY (trip_id) REFERENCES trip(id)
);