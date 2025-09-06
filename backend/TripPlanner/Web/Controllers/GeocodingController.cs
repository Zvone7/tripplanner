using System.Net;
using Domain.Exceptions;
using Domain.Models;
using Domain.Services;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/geocode")]
public class GeocodingController : ControllerBase
{
    private readonly ILocationIqClient _client;

    public GeocodingController(ILocationIqClient client)
    {
        _client = client;
    }

    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<LocationSearchResult>>> Search(
        [FromQuery] string q,
        [FromQuery] int limit = 8,
        [FromQuery] string? countrycodes = null,
        [FromQuery] string? lang = null,
        CancellationToken ct = default)
    {
        var query = (q ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(query))
            return BadRequest(new { error = "Missing query parameter ?q=" });

        if (limit <= 0 || limit > 50) limit = 8;

        try
        {
            var results = await _client.ForwardGeocodeAsync(
                query, limit, countrycodes, lang, ct);

            var normalized = results.Select(LocationSearchResult.FromLocationIq).ToList();
            return Ok(normalized);
        }
        catch (LocationIqException ex)
        {
            return StatusCode((int)HttpStatusCode.BadGateway, new { error = ex.Message });
        }
    }
}