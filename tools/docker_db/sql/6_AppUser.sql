CREATE TABLE app_user (
    id INT PRIMARY KEY IDENTITY,
    email NVARCHAR(255),
    name NVARCHAR(255),
    role NVARCHAR(255),
    created_at_utc DATETIME2
);