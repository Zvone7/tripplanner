CREATE TABLE segment (
    id INT PRIMARY KEY IDENTITY,
    segment_type_id INT,
    trip_id INT,
    start_datetime_utc DATETIME,
    start_datetime_utc_offset INT,
    end_datetime_utc DATETIME,
    end_datetime_utc_offset INT,
    name NVARCHAR(255),
    cost DECIMAL(10, 2),
    FOREIGN KEY (trip_id) REFERENCES trip(id),
    FOREIGN KEY (segment_type_id) REFERENCES segment_type(id)
);