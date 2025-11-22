CREATE TABLE currency (
    id INT PRIMARY KEY IDENTITY,
    symbol NVARCHAR(8) NOT NULL,
    short_name NVARCHAR(8) NOT NULL,
    name NVARCHAR(255) NOT NULL
);

INSERT INTO currency (symbol, short_name, name) VALUES
    ('€', 'EUR', 'Euro'),
    ('$', 'USD', 'US Dollar'),
    ('kr', 'NOK', 'Norwegian Krone'),
    ('kr', 'SEK', 'Swedish Krona'),
    ('kr', 'DKK', 'Danish Krone'),
    ('¥', 'JPY', 'Japanese Yen'),
    ('¥', 'CNY', 'Chinese Yuan'),
    ('Ft', 'HUF', 'Hungarian Forint'),
    ('zł', 'PLN', 'Polish Zloty');

CREATE TABLE currency_conversion (
    from_currency_id INT NOT NULL,
    to_currency_id INT NOT NULL,
    rate DECIMAL(18,6) NOT NULL,
    PRIMARY KEY (from_currency_id, to_currency_id),
    FOREIGN KEY (from_currency_id) REFERENCES currency(id),
    FOREIGN KEY (to_currency_id) REFERENCES currency(id)
);

INSERT INTO currency_conversion (from_currency_id, to_currency_id, rate) VALUES
    (1, 1, 1.000000),
    (1, 2, 1.080000), (2, 1, 0.925926),
    (1, 3, 11.500000), (3, 1, 0.086957),
    (1, 4, 11.300000), (4, 1, 0.088496),
    (1, 5, 7.450000), (5, 1, 0.134228),
    (1, 6, 160.000000), (6, 1, 0.006250),
    (1, 7, 7.800000), (7, 1, 0.128205),
    (1, 8, 390.000000), (8, 1, 0.002564),
    (1, 9, 4.300000), (9, 1, 0.232558);
