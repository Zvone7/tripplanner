CREATE TABLE segment (
    id INT PRIMARY KEY IDENTITY,
    segment_type_id INT,
    trip_id INT,
    start_datetime_utc DATETIME,
    end_datetime_utc DATETIME,
    name NVARCHAR(255),
    cost DECIMAL(10, 2),
    FOREIGN KEY (trip_id) REFERENCES trip(id),
    FOREIGN KEY (segment_type_id) REFERENCES segment_type(id)
);