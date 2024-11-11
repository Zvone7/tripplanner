/*
drop table [dbo].[option_to_segment]
drop table [dbo].[segment]
drop table [dbo].[segment_type]
drop table [dbo].[tripoption]
drop table [dbo].[trip]
*/

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
    name NVARCHAR(255),
    start_datetime_utc DATETIME null,
    end_datetime_utc DATETIME null,
    total_cost DECIMAL(10, 2) null default 0,
    FOREIGN KEY (trip_id) REFERENCES trip(id)
);

GO

CREATE TABLE segment_type(
    id INT PRIMARY KEY IDENTITY,
    short_name NVARCHAR(255),
    name NVARCHAR(255),
    description NVARCHAR(255),
    color NVARCHAR(16),
    icon_svg NVARCHAR(2048)
)

GO

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

GO

CREATE TABLE option_to_segment(
    id INT PRIMARY KEY IDENTITY,
    option_id INT,
    segment_id INT,
    FOREIGN KEY (option_id) REFERENCES tripoption(id),
    FOREIGN KEY (segment_id) REFERENCES segment(id)
)

insert into segment_type (short_name, name, description, color, icon_svg) values ('transport_plane', 'Plane', 'A flight from one location to another', 'blue', '<?xml version="1.0" ?><svg viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg"><path d="M482.3 192C516.5 192 576 221 576 256C576 292 516.5 320 482.3 320H365.7L265.2 495.9C259.5 505.8 248.9 512 237.4 512H181.2C170.6 512 162.9 501.8 165.8 491.6L214.9 320H112L68.8 377.6C65.78 381.6 61.04 384 56 384H14.03C6.284 384 0 377.7 0 369.1C0 368.7 .1818 367.4 .5398 366.1L32 256L.5398 145.9C.1818 144.6 0 143.3 0 142C0 134.3 6.284 128 14.03 128H56C61.04 128 65.78 130.4 68.8 134.4L112 192H214.9L165.8 20.4C162.9 10.17 170.6 0 181.2 0H237.4C248.9 0 259.5 6.153 265.2 16.12L365.7 192H482.3z"/></svg>')

insert into segment_type (short_name, name, description, color, icon_svg) values ('transport_train', 'Train', 'A train ride from one location to another', 'green', '<?xml version="1.0" ?><svg viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg"><path d="M568 192H8C3.6 192 0 195.6 0 200v112c0 4.4 3.6 8 8 8h560c4.4 0 8-3.6 8-8V200c0-4.4-3.6-8-8-8zM8 160C3.6 160 0 156.4 0 152s3.6-8 8-8h560c4.4 0 8 3.6 8 8s-3.6 8-8 8H8zm568 160H8c-4.4 0-8 3.6-8 8v112c0 4.4 3.6 8 8 8h560c4.4 0 8-3.6 8-8V328c0-4.4-3.6-8-8-8zm0-160H8c-4.4 0-8 3.6-8 8v112c0 4.4 3.6 8 8 8h560c4.4 0 8-3.6 8-8V168c0-4.4-3.6-8-8-8z"/></svg>')

insert into segment_type (short_name, name, description, color, icon_svg) values ('transport_car', 'Car', 'A car ride from one location to another', 'red', '<?xml version="1.0" ?><svg viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg"><path d="M624 192H16C7.2 192 0 199.2 0 208v96c0 8.8 7.2 16 16 16h16v64c0 35.3 28.7 64 64 64h448c35.3 0 64-28.7 64-64v-64h16c8.8 0 16-7.2 16-16v-96c0-8.8-7.2-16-16-16zM96 304c-8.8 0-16-7.2-16-16v-64h448v64c0 8.8-7.2 16-16 16H96zm528 144H16c-8.8 0-16 7.2-16 16s7.2 16 16 16h608c8.8 0 16-7.2 16-16s-7.2-16-16-16z"/></svg>')

insert into segment_type (short_name, name, description, color, icon_svg) values ('transport_bus', 'Bus', 'A bus ride from one location to another', 'orange', '<?xml version="1.0" ?><svg viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg"><path d="M624 192H16C7.2 192 0 199.2 0 208v96c0 8.8 7.2 16 16 16h16v64c0 35.3 28.7 64 64 64h448c35.3 0 64-28.7 64-64v-64h16c8.8 0 16-7.2 16-16v-96c0-8.8-7.2-16-16-16zM96 304c-8.8 0-16-7.2-16-16v-64h448v64c0 8.8-7.2 16-16 16H96zm528 144H16c-8.8 0-16 7.2-16 16s7.2 16 16 16h608c8.8 0 16-7.2 16-16s-7.2-16-16-16z"/></svg>')

insert into segment_type (short_name, name, description, color, icon_svg) values ('transport_other', 'Other', 'A ride from one location to another', 'purple', '<?xml version="1.0" ?><svg viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg"><path d="M568 192H8C3.6 192 0 195.6 0 200v112c0 4.4 3.6 8 8 8h560c4.4 0 8-3.6 8-8V200c0-4.4-3.6-8-8-8zM8 160C3.6 160 0 156.4 0 152s3.6-8 8-8h560c4.4 0 8 3.6 8 8s-3.6 8-8 8H8zm568 160H8c-4.4 0-8 3.6-8 8v112c0 4.4 3.6 8 8 8h560c4.4 0 8-3.6 8-8V328c0-4.4-3.6-8-8-8zm0-160H8c-4.4 0-8 3.6-8 8v112c0 4.4 3.6 8 8 8h560c4.4 0 8-3.6 8-8V168c0-4.4-3.6-8-8-8z"/></svg>')

insert into segment_type (short_name, name, description, color, icon_svg) values ('accomodation_hotel', 'Hotel', 'A stay at a hotel', 'blue', '<?xml version="1.0" ?><svg viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg"><path d="M624 192H16C7.2 192 0 199.2 0 208v96c0 8.8 7.2 16 16 16h608c8.8 0 16-7.2 16-16v-96c0-8.8-7.2-16-16-16zM16 128h608c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H16C7.2 192 0 184.8 0 176v-32c0-8.8 7.2-16 16-16zm0 256h608c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H16c-8.8 0-16-7.2-16-16v-32c0-8.8 7.2-16 16-16z"/></svg>')

insert into segment_type (short_name, name, description, color, icon_svg) values ('accomodation_hostel', 'Hostel', 'A stay at a hostel', 'green', '<?xml version="1.0" ?><svg viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg"><path d="M624 192H16C7.2 192 0 199.2 0 208v96c0 8.8 7.2 16 16 16h608c8.8 0 16-7.2 16-16v-96c0-8.8-7.2-16-16-16zM16 128h608c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H16C7.2 192 0 184.8 0 176v-32c0-8.8 7.2-16 16-16zm0 256h608c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H16c-8.8 0-16-7.2-16-16v-32c0-8.8 7.2-16 16-16z"/></svg>')

insert into segment_type (short_name, name, description, color, icon_svg) values ('accomodation_airbnb', 'Airbnb', 'A stay at an Airbnb', 'red', '<?xml version="1.0" ?><svg viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg"><path d="M624 192H16C7.2 192 0 199.2 0 208v96c0 8.8 7.2 16 16 16h608c8.8 0 16-7.2 16-16v-96c0-8.8-7.2-16-16-16zM16 128h608c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H16C7.2 192 0 184.8 0 176v-32c0-8.8 7.2-16 16-16zm0 256h608c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H16c-8.8 0-16-7.2-16-16v-32c0-8.8 7.2-16 16-16z"/></svg>')

insert into segment_type (short_name, name, description, color, icon_svg) values ('accomodation_other', 'Other', 'A stay at another type of accomodation', 'purple', '<?xml version="1.0" ?><svg viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg"><path d="M624 192H16C7.2 192 0 199.2 0 208v96c0 8.8 7.2 16 16 16h608c8.8 0 16-7.2 16-16v-96c0-8.8-7.2-16-16-16zM16 128h608c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H16C7.2 192 0 184.8 0 176v-32c0-8.8 7.2-16 16-16zm0 256h608c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H16c-8.8 0-16-7.2-16-16v-32c0-8.8 7.2-16 16-16z"/></svg>')