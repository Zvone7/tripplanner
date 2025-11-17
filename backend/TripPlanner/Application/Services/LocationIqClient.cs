using System.Text.Json;
using System.Text.Json.Serialization;
using System.Web;
using Domain.Exceptions;
using Domain.Models;
using Domain.Services;
using Domain.Settings;
using Microsoft.Extensions.Logging;
using LocationIqOptions = Domain.Settings.LocationIqOptions;

namespace Application.Services;

public sealed class LocationIqClient : ILocationIqClient
{
    private readonly HttpClient _http;
    private readonly ILogger<LocationIqClient> _logger;
    private readonly LocationIqOptions _opts;

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public LocationIqClient(
        HttpClient http,
        AppSettings appSettings,
        ILogger<LocationIqClient> logger)
    {
        _http = http;
        _logger = logger;
        _opts = appSettings.LocationIq;
    }

    public async Task<IReadOnlyList<LocationIqItem>> ForwardGeocodeAsync(
        string query,
        int limit,
        string? countrycodes,
        string? lang,
        CancellationToken ct = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(_opts.Token))
                throw new LocationIqException("LOCATIONIQ token is not configured.");

            var baseUrl = string.IsNullOrWhiteSpace(_opts.BaseUrl)
                ? "https://us1.locationiq.com/v1/search"
                : _opts.BaseUrl.TrimEnd('/');

            var url = new UriBuilder(baseUrl);
            var qp = HttpUtility.ParseQueryString(string.Empty);
            qp["key"] = _opts.Token;
            qp["format"] = "json";
            qp["q"] = query; // HttpUtility will handle encoding
            qp["limit"] = limit.ToString();
            qp["addressdetails"] = "1";
            qp["normalizecity"] = "1";
            qp["tag"] = "place:country,place:city,place:town,place:village";
            if (!string.IsNullOrWhiteSpace(countrycodes)) qp["countrycodes"] = countrycodes;
            if (!string.IsNullOrWhiteSpace(lang)) qp["accept-language"] = lang;
            url.Query = qp.ToString();

            using var req = new HttpRequestMessage(HttpMethod.Get, url.Uri);
            using var res = await _http.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, ct);

            if (!res.IsSuccessStatusCode)
            {
                var body = await res.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
                throw new LocationIqException(
                    $"LocationIQ upstream {(int)res.StatusCode} {res.ReasonPhrase}: {body}");
            }

            var resp = await res.Content.ReadAsStringAsync(ct);
            var data = JsonSerializer.Deserialize<List<LocationIqItem>>(resp, JsonOpts)
                       ?? new List<LocationIqItem>();
            return data;
        }
        catch (Exception e)
        {
            _logger.LogError(e, "LocationIQ ForwardGeocodeAsync failed");
            throw;
        }
    }
}