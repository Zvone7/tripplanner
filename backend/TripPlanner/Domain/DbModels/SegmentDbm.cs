namespace Domain.DbModels;

public class SegmentDbm{
    public int id { get; set; }
    public int trip_id { get; set; }
    public DateTime start_time { get; set; }
    public DateTime end_time { get; set; }
    public string nickname { get; set; }
    public decimal cost { get; set; }
}