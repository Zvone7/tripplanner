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
    currency_id INT NOT NULL DEFAULT 1,
    FOREIGN KEY (trip_id) REFERENCES trip(id),
    FOREIGN KEY (segment_type_id) REFERENCES segment_type(id),
    FOREIGN KEY (currency_id) REFERENCES currency(id)
);

ALTER TABLE segment
ADD start_location_id INT NULL,
    end_location_id INT NULL,
    FOREIGN KEY (start_location_id) REFERENCES location(id),
    FOREIGN KEY (end_location_id) REFERENCES location(id);


ALTER TABLE segment
ADD is_ui_visible BIT NOT NULL DEFAULT 1;
