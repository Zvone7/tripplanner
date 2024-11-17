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
    start_datetime_utc_offset INT,
    end_datetime_utc DATETIME,
    end_datetime_utc_offset INT,
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

insert into segment_type (short_name, name, description, color, icon_svg) values ('transport_train', 'Train', 'A train ride from one location to another', 'green', '<?xml version="1.0" ?><svg id="Layer_2" style="enable-background:new 0 0 1000 1000;" version="1.1" viewBox="0 0 1000 1000" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M814.817,382.75h-45.773c0-9.665-7.835-17.5-17.5-17.5h-57.5c-9.665,0-17.5,7.835-17.5,17.5h-64  c0-9.665-7.835-17.5-17.5-17.5h-150c-9.665,0-17.5,7.835-17.5,17.5h-28.058c-123.542,0-228.097,91.845-243.34,214.442  c-0.04,0.323-0.079,0.64-0.117,0.952c-0.166,1.379-0.064,2.719,0.241,3.986c-3.965,1.814-6.726,5.807-6.726,10.453v10.667  c0,6.351,5.149,11.5,11.5,11.5h193.611c6.351,0,11.5-5.149,11.5-11.5v-10.667c0-0.625-0.064-1.235-0.16-1.833h25.859  c-0.096,0.598-0.16,1.208-0.16,1.833v10.667c0,6.351,5.149,11.5,11.5,11.5h193.611c6.351,0,11.5-5.149,11.5-11.5v-10.667  c0-0.625-0.064-1.235-0.16-1.833h25.859c-0.096,0.598-0.16,1.208-0.16,1.833v10.667c0,6.351,5.149,11.5,11.5,11.5h193.611  c6.351,0,11.5-5.149,11.5-11.5v-10.667c0-0.625-0.064-1.235-0.16-1.833h0.16V418.389C850.456,398.706,834.5,382.75,814.817,382.75z   M395.476,497.785c-17.829,23.27-45.942,38.094-77.072,38.094h-119.1c14.1-30.59,35.01-57.27,60.68-78.26h115.608  C396.287,457.62,408.062,481.358,395.476,497.785z M451.544,482.62c0-13.807,11.193-25,25-25h242c13.807,0,25,11.193,25,25v28.26  c0,13.807-11.193,25-25,25h-242c-13.807,0-25-11.193-25-25V482.62z M812.044,579.75h-352c-4.694,0-8.5-3.806-8.5-8.5  s3.806-8.5,8.5-8.5h352c4.694,0,8.5,3.806,8.5,8.5S816.738,579.75,812.044,579.75z M820.544,510.88c0,13.807-11.193,25-25,25h-1.5  c-13.807,0-25-11.193-25-25v-28.26c0-13.807,11.193-25,25-25h1.5c13.807,0,25,11.193,25,25V510.88z" style="fill:#231F20;"/></svg>')

insert into segment_type (short_name, name, description, color, icon_svg) values ('transport_car', 'Car', 'A car ride from one location to another', 'red', '<?xml version="1.0" ?><svg id="Layer_2" style="enable-background:new 0 0 1000 1000;" version="1.1" viewBox="0 0 1000 1000" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M284.353,608.065c7.629,0,13.858-5.995,14.228-13.532c0.013-0.236,0.019-0.474,0.019-0.712  c0-7.867-6.379-14.246-14.246-14.246c-7.867,0-14.246,6.379-14.246,14.246c0,0.238,0.007,0.476,0.019,0.712  C270.496,602.07,276.725,608.065,284.353,608.065z" style="fill:#231F20;"/><path d="M729.354,579.575c-7.867,0-14.246,6.379-14.246,14.246c0,0.238,0.007,0.476,0.019,0.712  c0.37,7.537,6.599,13.532,14.228,13.532s13.858-5.995,14.228-13.532c0.013-0.236,0.018-0.474,0.018-0.712  C743.6,585.954,737.221,579.575,729.354,579.575z" style="fill:#231F20;"/><path d="M172.624,597.235h43.569c1.77,36.11,31.61,64.83,68.16,64.83s66.391-28.72,68.16-64.83h308.68  c1.771,36.11,31.61,64.83,68.16,64.83s66.391-28.72,68.16-64.83h35.71c4.01,0,7.65-1.8,10.28-4.7c2.63-2.9,4.26-6.9,4.26-11.33  c0-3.81-1.229-7.5-3.479-10.4l-7.41-9.57c16.55-37.48,10.75-91.19,5.229-122.11c-3.17-17.81-12.899-33.38-26.93-42.87  c-16.811-11.38-45.44-26.93-92.63-43.51c-93.92-32.99-259.95-4.32-292.641,22.5c-26.05,21.36-77.59,72-142.92,79.5  c-33.949,3.89-63.02,13.82-83.12,22.47c-17.89,7.69-29.859,26.44-30.51,47.59l-0.71,22.93l-11.33,8.33  c-2.84,2.09-5.109,4.88-6.67,8.1c-1.56,3.21-2.41,6.85-2.41,10.6C152.233,587.175,161.363,597.235,172.624,597.235z   M772.464,597.235c-1.74,22.25-20.41,39.83-43.11,39.83s-41.37-17.58-43.109-39.83c-0.091-1.12-0.141-2.26-0.141-3.41  c0-23.85,19.4-43.25,43.25-43.25c23.851,0,43.25,19.4,43.25,43.25C772.604,594.975,772.554,596.115,772.464,597.235z   M827.711,487.775c3.336,0.69,5.771,3.549,5.956,6.95c0.821,15.131-1.424,30.716-2.923,39.046c-0.641,3.558-3.738,6.137-7.353,6.137  h-4.998c-4.402,0-7.851-3.787-7.439-8.17l3.002-32.026c0.15-1.604,0.815-3.116,1.895-4.311l4.802-5.316  C822.429,488.117,825.115,487.238,827.711,487.775z M681.14,418.279l5.027-23.402c2.199-10.237,10.731-17.901,21.145-18.993  l4.264-0.448c0.896,0.297,1.808,0.588,2.683,0.895c46.205,16.234,72.761,31.053,86.901,40.625  c8.388,5.674,14.338,15.349,16.331,26.549c0.243,1.362,0.478,2.718,0.703,4.069H704.81c-5.169,0-10.201-1.654-14.362-4.72  C682.782,437.207,679.14,427.589,681.14,418.279z M577.688,501.908h-25c-4.695,0-8.5-3.806-8.5-8.5s3.805-8.5,8.5-8.5h25  c4.694,0,8.5,3.806,8.5,8.5S582.382,501.908,577.688,501.908z M435.676,403.089c3.835-3.277,7.146-6.108,10.079-8.512  c4.355-3.573,22.641-12.418,60.703-20.347c31.671-6.597,66.803-10.498,100.046-11.177l-11.623,66.681  c-2.934,16.83-17.209,29.335-34.278,30.028l-173.586,7.045c-9.886,0.401-19.4-3.256-26.45-9.948  C392.087,440.323,417.549,418.579,435.676,403.089z M284.353,550.575c23.851,0,43.25,19.4,43.25,43.25c0,1.15-0.05,2.29-0.14,3.41  c-1.74,22.25-20.41,39.83-43.11,39.83c-22.7,0-41.37-17.58-43.109-39.83c-0.091-1.12-0.141-2.26-0.141-3.41  C241.104,569.975,260.504,550.575,284.353,550.575z M199.52,502.575c6.812,0,12.333,8.357,12.333,18.667  c0,10.309-5.521,18.667-12.333,18.667c-6.811,0-12.333-8.357-12.333-18.667C187.188,510.932,192.709,502.575,199.52,502.575z" style="fill:#231F20;"/></svg>')

insert into segment_type (short_name, name, description, color, icon_svg) values ('transport_bus', 'Bus', 'A bus ride from one location to another', 'orange', '<?xml version="1.0" ?><svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><g id="School_bus"><path d="M321.4221,361.1694c1.7774,57.816,85.7163,57.83,87.5.0011C407.1469,303.3556,323.208,303.3406,321.4221,361.1694Z"/><path d="M85.1743,361.1694c1.7773,57.816,85.7162,57.83,87.5.0011C170.8991,303.3545,86.96,303.3406,85.1743,361.1694Z"/><path d="M465.8356,159.8756c3.042-27.3491-15.2954-52.3632-43.75-52.4124h-271.25a43.6541,43.6541,0,0,0-43.75,43.75v105h-.0876L61.7612,275.55a26.2963,26.2963,0,0,0-15.9256,24.2377v48.3a13.0922,13.0922,0,0,0,13.125,13.125c3.3838-92.8641,136.5842-92.8213,140,0h96.25c3.3838-92.8641,136.5842-92.8213,140,0h17.5a13.1065,13.1065,0,0,0,13.125-13.125C465.8441,348.0925,465.8292,159.89,465.8356,159.8756Zm-275.625,96.3376h-56.875v-96.25h56.875Zm83.125,0h-56.875v-96.25h56.875Zm83.125,0h-56.875v-96.25h56.875Zm83.125,0h-56.875v-96.25h56.875Z"/></g></svg>')

insert into segment_type (short_name, name, description, color, icon_svg) values ('transport_other', 'Other', 'A ride from one location to another', 'purple', '<?xml version="1.0" ?><svg id="Layer_2" style="enable-background:new 0 0 1000 1000;" version="1.1" viewBox="0 0 1000 1000" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M183.066,699.409c-1.07,5.19-1.64,10.56-1.64,16.07c0,43.47,35.25,78.72,78.72,78.72  c43.48,0,78.73-35.25,78.73-78.72c0-5.51-0.57-10.88-1.64-16.07h-25.81c1.59,5.08,2.45,10.47,2.45,16.06  c0,29.63-24.1,53.73-53.73,53.73c-29.62,0-53.72-24.1-53.72-53.73c0-5.59,0.86-10.98,2.45-16.06H183.066z" style="fill:#231F20;"/><path d="M287.207,715.479c0-6.02-1.96-11.57-5.29-16.07h-43.54c-3.32,4.5-5.28,10.05-5.28,16.07  c0,14.94,12.11,27.05,27.05,27.05C275.086,742.529,287.207,730.419,287.207,715.479z" style="fill:#231F20;"/><path d="M335.076,565.819c6.02,12.58,12.97,18.98,16.64,21.71h214.41c1.55,0,2.81-1.26,2.81-2.82  c0-9.28,3.58-18.32,9.88-25.09c-46.71-0.95-119.66-8.84-151.27-46.6c-25.59-30.56-66.6-43.44-99.54-48.79  C319.306,517.639,326.966,548.899,335.076,565.819z" style="fill:#231F20;"/><path d="M790.021,303.705c5.983,1.064,12.026-1.493,15.471-6.501l39.52-57.448  c6.644-9.658,0.619-22.908-11.027-24.252c-81.389-9.395-343.889-30.661-579.526,49.937c-13.064,4.468-14.278,22.471-1.923,28.633  l64.033,31.935c-8.549,23.73-16.1,49.23-20.972,66.619c-3.52,12.59-14.99,21.29-28.05,21.29c-6.21,0-12.09,1.97-16.92,5.4  c-4.83,3.44-8.61,8.34-10.62,14.22c-4.63,13.51-9,27.73-12.67,42.17c-2-0.52-4.07-0.79-6.19-0.79c-17.55,0-31.29,18.45-31.29,42  c0,21.64,11.6,38.97,27.09,41.64c0.45,9.48,1.65,18.59,3.76,27.17c2.167,8.792,4.175,16.782,6.038,24.05l-12.713,6.934  c-27.065,14.763-48.715,37.776-61.801,65.691h96.699c0.004,0.003,0.006,0.005,0.006,0.005h332.14c27.96,0,53.83-14.82,67.97-38.94  c1.252-2.136,2.601-4.195,4.03-6.181l28.292,28.292c-11.143,13.582-17.834,30.955-17.834,49.894  c0,43.477,35.245,78.723,78.723,78.723c43.477,0,78.723-35.246,78.723-78.723c0-40.604-30.745-74.019-70.223-78.259v-32.686h58.74  c21.14,0,38.27-17.14,38.27-38.27c0-9.08-3.68-17.31-9.64-23.26c-5.95-5.96-14.17-9.64-23.26-9.64h-31.51V302.616  C785.631,302.958,787.857,303.32,790.021,303.705z M221.146,541.919c-1.39,0-2.81-0.43-4.19-1.26c-5.35-3.15-10.1-12.03-10.1-23.74  c0-14.73,7.53-25,14.29-25c0.77,0,1.54,0.13,2.32,0.4c6.05,1.99,11.96,11.55,11.96,24.6  C235.426,531.649,227.896,541.919,221.146,541.919z M651.356,537.373c-22.179,5.603-42.707,16.933-59.4,33.116  c-3.85,3.73-6.02,8.86-6.02,14.22v0.29c0.16,10.83-8.98,19.53-19.81,19.53h-219.2c0,0-56.39-25.52-34.91-147.7  c1.141-6.492,2.323-12.791,3.532-18.92h29.308c4.694,0,8.5-3.806,8.5-8.5s-3.806-8.5-8.5-8.5h-25.779  c8.117-37.224,17.216-66.999,25.371-89.592c43.332-6.538,185.67-26.943,306.908-32.181V537.373z M664.461,624.631  c4.123-3.69,8.608-6.935,13.385-9.672c11.73-6.72,25.18-10.43,39.16-10.43h16.75v32.686c-15.11,1.623-28.928,7.528-40.245,16.467  L664.461,624.631z M733.757,662.43v27.359c-1.015,0.336-2.004,0.728-2.961,1.176l-19.415-19.414  C717.922,666.939,725.527,663.744,733.757,662.43z M795.979,715.474c0,29.623-24.1,53.724-53.723,53.724  c-29.622,0-53.723-24.101-53.723-53.724c0-12.013,3.965-23.118,10.653-32.075l19.246,19.246c-2.06,3.818-3.231,8.187-3.231,12.83  c0,14.942,12.113,27.055,27.055,27.055c14.942,0,27.055-12.113,27.055-27.055c0-11.972-7.779-22.121-18.555-25.685V662.43  C776.354,666.517,795.979,688.743,795.979,715.474z M766.356,533.359h-82.77c-5.115,0-10.199,0.304-15.23,0.89V298.5  c13.932-0.438,27.495-0.649,40.5-0.587v92.173c0,4.695,3.806,8.5,8.5,8.5c4.694,0,8.5-3.805,8.5-8.5v-91.924  c14.471,0.365,28.07,1.127,40.5,2.357V533.359z" style="fill:#231F20;"/><path d="M591.506,548.319c6.64-5.28,13.68-9.93,21.04-13.93c0.76-3.16,1.46-6.33,2.12-9.51  c3.69-17.86,5.79-36.06,6.25-54.36l1.52-59.83c0.23-9.19-7.16-16.77-16.35-16.77h-14.03c-7.72,0-14.39,5.4-15.99,12.95l-18.45,86.82  c-0.5,2.33-0.34,4.75,0.46,7c0.51,1.45,0.75,2.91,0.75,4.33c0,6.85-5.54,12.9-12.92,12.9h-10.04c-14.6,0-28.2,5.47-38.55,14.7  c22.53,5.94,50.12,9.35,81.85,10C583.977,542.719,588.427,544.839,591.506,548.319z" style="fill:#231F20;"/></svg>')

insert into segment_type (short_name, name, description, color, icon_svg) values ('accomodation_hotel', 'Hotel', 'A stay at a hotel', 'blue', '<?xml version="1.0" ?><svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M480 448v-384c17.67 0 32-14.33 32-32c0-17.67-14.33-32-32-32H32c-17.67 0-32 14.33-32 32c0 17.67 14.33 32 32 32v384c-17.67 0-32 14.33-32 32c0 17.67 14.33 32 32 32h176v-96h96v96H480c17.67 0 32-14.33 32-32C512 462.3 497.7 448 480 448zM224 108.8c0-6.375 6.375-12.75 12.75-12.75h38.5C281.6 96.01 288 102.4 288 108.8v38.5c0 6.375-6.375 12.75-12.75 12.75h-38.5C230.4 160 224 153.6 224 147.3V108.8zM224 204.8c0-6.375 6.375-12.75 12.75-12.75h38.5C281.6 192 288 198.4 288 204.8v38.5c0 6.375-6.375 12.75-12.75 12.75h-38.5C230.4 256 224 249.6 224 243.3V204.8zM96 108.8c0-6.375 6.375-12.75 12.75-12.75h38.5C153.6 96.02 160 102.4 160 108.8V147.3c0 6.375-6.375 12.75-12.75 12.75h-38.5C102.4 160 96 153.6 96 147.3V108.8zM147.3 256h-38.5C102.4 256 96 249.6 96 243.3V204.8c0-6.375 6.375-12.75 12.75-12.75h38.5C153.6 192 160 198.4 160 204.8V243.3C160 249.6 153.6 256 147.3 256zM160 384c0-53 43-96 96-96s96 43 96 96H160zM416 243.3c0 6.375-6.375 12.75-12.75 12.75h-38.5C358.4 256 352 249.6 352 243.3V204.8c0-6.375 6.375-12.75 12.75-12.75h38.5C409.6 192 416 198.4 416 204.8V243.3zM416 147.3c0 6.375-6.375 12.75-12.75 12.75h-38.5C358.4 160 352 153.6 352 147.3V108.8c0-6.375 6.375-12.75 12.75-12.75h38.5C409.6 96.02 416 102.4 416 108.8V147.3z"/></svg>')

insert into segment_type (short_name, name, description, color, icon_svg) values ('accomodation_hostel', 'Hostel', 'A stay at a hostel', 'green', '<?xml version="1.0" ?><svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg"><g id="Solid"><path d="M9,11V46a2.0026,2.0026,0,0,1-2,2H4a2.0026,2.0026,0,0,1-2-2V11A2.0026,2.0026,0,0,1,4,9H7A2.0026,2.0026,0,0,1,9,11ZM46,2H43a2.0026,2.0026,0,0,0-2,2V46a2.0026,2.0026,0,0,0,2,2h3a2.0026,2.0026,0,0,0,2-2V4A2.0026,2.0026,0,0,0,46,2ZM11,20H39v6H22v8h5V32a2,2,0,0,1,2-2h6a2,2,0,0,1,2,2v2a2,2,0,0,1,2,2v2H11V36a1.99139,1.99139,0,0,1,1-1.7226V26H11Zm9,14V31H14v3Zm0-8H14v3h6ZM11,46H39V40H11ZM37,14V12a2,2,0,0,0-2-2H29a2,2,0,0,0-2,2v2H13a2,2,0,0,0-2,2v2H39V16A2,2,0,0,0,37,14Z"/></g></svg>')

insert into segment_type (short_name, name, description, color, icon_svg) values ('accomodation_airbnb', 'Airbnb', 'A stay at an Airbnb', 'red', '<?xml version="1.0" ?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Capa_1" viewBox="0 0 24 24" style="enable-background:new 0 0 24 24;" xml:space="preserve"><path d="M22.834,17.057c-0.12-0.288-0.24-0.601-0.36-0.865c-0.192-0.433-0.577-1.249-0.577-1.249  c-1.658-3.604-3.445-7.25-5.309-10.859c-0.164-0.317-0.456-0.889-0.649-1.273c-0.24-0.432-0.48-0.889-0.865-1.321  C14.306,0.529,13.201,0,12.024,0c-1.201,0-2.282,0.529-3.075,1.441C8.588,1.874,8.324,2.33,8.084,2.763  C7.892,3.147,7.435,4.036,7.435,4.036c-1.85,3.604-3.652,7.255-5.309,10.859c0,0-0.384,0.841-0.577,1.273  c-0.12,0.264-0.24,0.553-0.36,0.865c-0.312,0.889-0.408,1.73-0.288,2.595c0.264,1.802,1.465,3.315,3.123,3.988  C4.648,23.88,5.297,24,5.97,24c0.192,0,0.432-0.024,0.625-0.048c0.793-0.096,1.61-0.36,2.402-0.817  c0.985-0.553,1.922-1.345,2.979-2.498c1.057,1.153,2.018,1.946,2.979,2.498c0.793,0.457,1.61,0.721,2.402,0.817  C17.549,23.976,17.789,24,17.982,24c0.673,0,1.345-0.12,1.946-0.385c1.682-0.673,2.859-2.21,3.123-3.988  C23.243,18.787,23.147,17.946,22.834,17.057z M12,18.306c-1.297-1.634-2.138-3.171-2.426-4.469c-0.12-0.553-0.144-1.033-0.072-1.465  c0.048-0.384,0.192-0.721,0.384-1.009c0.456-0.649,1.225-1.057,2.114-1.057s1.682,0.384,2.114,1.057  c0.192,0.288,0.336,0.625,0.384,1.009c0.072,0.432,0.048,0.937-0.072,1.465C14.138,15.111,13.297,16.649,12,18.306z M21.585,19.435  c-0.168,1.249-1.009,2.33-2.186,2.811c-0.577,0.24-1.201,0.312-1.826,0.24c-0.601-0.072-1.201-0.264-1.826-0.625  c-0.865-0.48-1.73-1.225-2.739-2.33c1.586-1.946,2.547-3.724,2.907-5.309c0.168-0.745,0.192-1.418,0.12-2.042  c-0.096-0.601-0.312-1.153-0.649-1.634C14.642,9.466,13.393,8.841,12,8.841s-2.643,0.649-3.387,1.706  c-0.336,0.48-0.553,1.033-0.649,1.634c-0.096,0.625-0.072,1.321,0.12,2.042c0.36,1.585,1.345,3.387,2.907,5.333  c-0.985,1.105-1.874,1.85-2.739,2.33c-0.625,0.36-1.225,0.553-1.826,0.625c-0.649,0.072-1.273-0.024-1.826-0.24  c-1.177-0.48-2.018-1.562-2.186-2.811c-0.072-0.601-0.024-1.201,0.216-1.874c0.072-0.24,0.192-0.48,0.312-0.769  c0.168-0.384,0.577-1.249,0.577-1.249c1.658-3.579,3.435-7.231,5.285-10.787c0,0,0.456-0.889,0.649-1.249  c0.192-0.385,0.408-0.745,0.673-1.057c0.505-0.576,1.177-0.889,1.922-0.889c0.745,0,1.417,0.312,1.922,0.889  c0.264,0.312,0.48,0.673,0.673,1.057c0.192,0.36,0.488,0.936,0.649,1.249c1.831,3.577,3.604,7.231,5.261,10.811  c0,0,0.36,0.841,0.553,1.225c0.12,0.288,0.24,0.529,0.312,0.769C21.609,18.21,21.681,18.811,21.585,19.435z"/></svg>')

insert into segment_type (short_name, name, description, color, icon_svg) values ('accomodation_other', 'Other', 'A stay at another type of accomodation', 'purple', '<?xml version="1.0" ?><svg enable-background="new 0 0 32 32" id="Glyph" version="1.1" viewBox="0 0 32 32" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M30.854,16.548C30.523,17.43,29.703,18,28.764,18H28v11c0,0.552-0.448,1-1,1h-6v-7c0-2.757-2.243-5-5-5  s-5,2.243-5,5v7H5c-0.552,0-1-0.448-1-1V18H3.235c-0.939,0-1.759-0.569-2.09-1.451c-0.331-0.882-0.088-1.852,0.62-2.47L13.444,3.019  c1.434-1.357,3.679-1.357,5.112,0l11.707,11.086C30.941,14.696,31.185,15.666,30.854,16.548z" id="XMLID_219_"/></svg>')

-- alter segment table to add start_datetime_utc_offset, nullable int with default value 0
alter table segment add start_datetime_utc_offset int default 0;

-- now make that column no longer nullable
alter table segment alter column start_datetime_utc_offset int not null;