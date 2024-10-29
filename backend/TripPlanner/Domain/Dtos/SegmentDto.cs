namespace Domain.Dtos;

public class SegmentDto
{
    public int Id { get; set; }
    public int TripId { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string Nickname { get; set; }
    public decimal Cost { get; set; }
}