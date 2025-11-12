CREATE TABLE tripoption (
    id INT PRIMARY KEY IDENTITY,
    trip_id INT,
    name NVARCHAR(255),
    start_datetime_utc DATETIME null,
    end_datetime_utc DATETIME null,
    total_cost DECIMAL(10, 2) null default 0,
    FOREIGN KEY (trip_id) REFERENCES trip(id)
);

ALTER TABLE tripoption
ADD is_ui_visible BIT NOT NULL DEFAULT 1;