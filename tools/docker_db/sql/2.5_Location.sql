CREATE TABLE location (
    id INT PRIMARY KEY IDENTITY,
    provider NVARCHAR(50),
    provider_place_id NVARCHAR(255),
    name NVARCHAR(255),
    country NVARCHAR(255),
    country_code NVARCHAR(10),
    lat FLOAT,
    lng FLOAT,
    formatted NVARCHAR(512)
);