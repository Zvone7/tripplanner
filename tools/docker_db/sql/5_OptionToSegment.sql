CREATE TABLE option_to_segment(
    id INT PRIMARY KEY IDENTITY,
    option_id INT,
    segment_id INT,
    FOREIGN KEY (option_id) REFERENCES tripoption(id),
    FOREIGN KEY (segment_id) REFERENCES segment(id)
)