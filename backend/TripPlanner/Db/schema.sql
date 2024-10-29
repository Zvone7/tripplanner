
CREATE TABLE trip (
    id INT PRIMARY KEY IDENTITY,
    name NVARCHAR(255),
    description NVARCHAR(255),
    user_id INT DEFAULT 1,
    is_active BIT
);

GO

CREATE TABLE tripoption (
    id INT PRIMARY KEY IDENTITY,
    trip_id INT,
    nickname NVARCHAR(255),
    start_date DATETIME null,
    end_date DATETIME null,
    total_cost DECIMAL(10, 2) null default 0,
    FOREIGN KEY (trip_id) REFERENCES trip(id)
);

GO

CREATE TABLE segment (
    id INT PRIMARY KEY IDENTITY,
    trip_id INT,
    start_time DATETIME,
    end_time DATETIME,
    nickname NVARCHAR(255),
    cost DECIMAL(10, 2),
    FOREIGN KEY (trip_id) REFERENCES trip(id)
);

GO

CREATE TABLE option_to_segment(
    id INT PRIMARY KEY IDENTITY,
    option_id INT,
    segment_id INT,
    FOREIGN KEY (option_id) REFERENCES tripoption(id),
    FOREIGN KEY (segment_id) REFERENCES segment(id)
)