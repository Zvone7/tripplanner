namespace Domain.DbModels;

public class SegmentDbm{
    public int id { get; set; }
    public int trip_id { get; set; }
    public DateTime start_datetime_utc { get; set; }
    public int start_datetime_utc_offset { get; set; }
    public DateTime end_datetime_utc { get; set; }
    public int end_datetime_utc_offset { get; set; }
    public string name { get; set; }
    public decimal cost { get; set; }
    public int segment_type_id { get; set; }
    public string comment { get; set; }
}