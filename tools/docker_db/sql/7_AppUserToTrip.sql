CREATE TABLE app_user_to_trip (
    id INT PRIMARY KEY IDENTITY,
    app_user_id INT,
    trip_id INT,
    FOREIGN KEY (app_user_id) REFERENCES app_user(id),
    FOREIGN KEY (trip_id) REFERENCES trip(id)
);