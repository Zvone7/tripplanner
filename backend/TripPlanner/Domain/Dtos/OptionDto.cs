namespace Domain.Dtos;

public class OptionDto
{
    public int Id { get; set; }
    public int TripId { get; set; }
    public string Name { get; set; }
    public DateTime? StartDateTimeUtc { get; set; }
    public DateTime? EndDateTimeUtc { get; set; }
    public decimal TotalCost { get; set; }
}