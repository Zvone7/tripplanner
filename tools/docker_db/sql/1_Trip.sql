
CREATE TABLE trip (
    id INT PRIMARY KEY IDENTITY,
    name NVARCHAR(255),
    description NVARCHAR(255),
    user_id INT DEFAULT 1,
    is_active BIT
);