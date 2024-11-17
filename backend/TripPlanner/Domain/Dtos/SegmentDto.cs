namespace Domain.Dtos;

public class SegmentDto
{
    public int Id { get; set; }
    public int TripId { get; set; }
    public DateTime StartDateTimeUtc { get; set; }
    public int StartDateTimeUtcOffset { get; set; }
    public DateTime EndDateTimeUtc { get; set; }
    public int EndDateTimeUtcOffset { get; set; }
    public string Name { get; set; }
    public decimal Cost { get; set; }
    public int SegmentTypeId { get; set; }
}