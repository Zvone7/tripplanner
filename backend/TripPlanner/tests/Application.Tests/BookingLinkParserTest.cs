using Application.Services;
using Domain.Models;
using Domain.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;

namespace Application.Tests;

public class BookingLinkParserTest
{
    private const string SampleBookingUrl =
        "https://www.booking.com/hotel/hu/the-rose-garden-apartments.en-gb.html?aid=304142&label=gen173nr-10CAEoggI46AdICVgEaKoBiAEBmAEzuAEHyAEM2AED6AEB-AEBiAIBqAIBuAKU-4bJBsACAdICJGUyMWU5NzdjLTE2M2EtNDBiMy05MWMxLWQ3OTAyMGZhNWU3YtgCAeACAQ&sid=3fce1ce20d4a1a629b6c57893238aa5b&all_sr_blocks=995325609_372429847_4_0_0_1230343&checkin=2026-01-15&checkout=2026-01-18&dest_id=-850553&dest_type=city&dist=0&group_adults=4&group_children=0&hapos=1&highlighted_blocks=995325609_372429847_4_0_0_1230343&hpos=1&matching_block_id=995325609_372429847_4_0_0_1230343&no_rooms=2&req_adults=4&req_children=0&room1=A%2CA&room2=A%2CA&sb_price_type=total&sr_order=popularity&sr_pri_blocks=995325609_372429847_4_0_0_1230343_27254&srepoch=1763819086&srpvid=b0530c90a697a8a56a9e7cf878c0b769&type=total&ucfs=1&";

    [Test]
    public async Task ParseBookingLink_ShouldNormalizeFieldsAndReturnGeocodedLocation()
    {
        var parser = BuildParser();

        var suggestion = await parser.ParseBookingLinkAsync(SampleBookingUrl, CancellationToken.None);

        suggestion.Name.Should().Be("The Rose Garden Apartments");
        suggestion.StartDateLocal.Should().Be("2026-01-15T15:00");
        suggestion.EndDateLocal.Should().Be("2026-01-18T11:00");
        suggestion.Cost.Should().Be(272.54m);
        suggestion.CurrencyCode.Should().BeNull(); // no explicit currency in url
        suggestion.Location.Should().NotBeNull();
        suggestion.Location!.Name.Should().Be("Budapest");
        suggestion.Location.Latitude.Should().Be(47.5);
        suggestion.Location.Longitude.Should().Be(19.05);
    }

    [Test]
    public async Task ParseBookingLink_ShouldUseExplicitPriceWhenProvided()
    {
        var parser = BuildParser();
        const string explicitPriceUrl =
            "https://www.booking.com/hotel/hr/example.en-us.html?checkin=2025-06-10&checkout=2025-06-12&price=123.45&ss=Zagreb";

        var suggestion = await parser.ParseBookingLinkAsync(explicitPriceUrl, CancellationToken.None);

        suggestion.Cost.Should().Be(123.45m);
        suggestion.Name.Should().Be("Example");
        suggestion.LocationName.ToLower().Should().Contain("hr");
    }

    private static BookingLinkParser BuildParser()
    {
        var fakeLocationClient = new FakeLocationIqClient();
        return new BookingLinkParser(fakeLocationClient, NullLogger<BookingLinkParser>.Instance);
    }

    private sealed class FakeLocationIqClient : ILocationIqClient
    {
        public Task<IReadOnlyList<LocationIqItem>> ForwardGeocodeAsync(
            string query,
            int limit,
            string? countrycodes,
            string? lang,
            CancellationToken ct = default)
        {
            var item = new LocationIqItem
            {
                DisplayName = "Budapest, Hungary",
                Lat = "47.5",
                Lon = "19.05",
                Address = new LocationIqAddress
                {
                    City = "Budapest",
                    Country = "Hungary",
                    CountryCode = "hu"
                },
                PlaceId = "123456"
            };

            return Task.FromResult<IReadOnlyList<LocationIqItem>>(new[] { item });
        }
    }
}
