
namespace Domain.Models;
public sealed class LocationIqOptions
{
    /// <summary>Your LocationIQ token (set via configuration)</summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>Override base URL if needed (defaults to https://us1.locationiq.com/v1/search)</summary>
    public string? BaseUrl { get; set; }
}