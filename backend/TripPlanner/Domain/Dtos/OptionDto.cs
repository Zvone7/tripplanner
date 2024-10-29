namespace Domain.Dtos;

public class OptionDto
{
    public int Id { get; set; }
    public int TripId { get; set; }
    public string Name { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public decimal TotalCost { get; set; }
}