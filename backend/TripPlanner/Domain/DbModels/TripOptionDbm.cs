namespace Domain.DbModels;

public class TripOptionDbm
{
    public int id { get; set; }
    public int trip_id { get; set; }
    public string nickname { get; set; }
    public DateTime? start_date { get; set; }
    public DateTime? end_date { get; set; }
    public decimal total_cost { get; set; }
}