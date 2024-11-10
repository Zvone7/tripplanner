CREATE TABLE tripoption (
    id INT PRIMARY KEY IDENTITY,
    trip_id INT,
    nickname NVARCHAR(255),
    start_date DATETIME null,
    end_date DATETIME null,
    total_cost DECIMAL(10, 2) null default 0,
    FOREIGN KEY (trip_id) REFERENCES trip(id)
);