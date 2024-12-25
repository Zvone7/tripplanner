using Domain.ActionModels;
using Domain.DbModels;
using Domain.Dtos;

namespace Application.Services;

public class SegmentService
{
    private readonly SegmentRepository _segmentRepository_;
    private readonly OptionRepository _optionRepository_;
    private readonly TripRepository _tripRepository_;
    private readonly OptionService _optionService_;

    public SegmentService(
        SegmentRepository segmentRepository,
        OptionRepository optionRepository,
        TripRepository tripRepository,
        OptionService optionService)
    {
        _segmentRepository_ = segmentRepository;
        _optionRepository_ = optionRepository;
        _tripRepository_ = tripRepository;
        _optionService_ = optionService;
    }

    public async Task<List<SegmentDto>> GetAllByOptionIdAsync(int userId, int optionId, CancellationToken cancellationToken)
    {
        var segments = await _segmentRepository_.GetAllByOptionIdAsync(optionId, cancellationToken);
        if (segments.Count != 0)
        {
            await _tripRepository_.ThrowIfUserDoesntHaveAccessToTripAsync(userId, segments[0].trip_id, cancellationToken);
        }
        var result = segments.Select(s => new SegmentDto
        {
            Id = s.id,
            Cost = s.cost,
            EndDateTimeUtc = s.end_datetime_utc,
            EndDateTimeUtcOffset = s.end_datetime_utc_offset,
            Name = s.name,
            StartDateTimeUtc = s.start_datetime_utc,
            StartDateTimeUtcOffset = s.start_datetime_utc_offset,
            TripId = s.trip_id,
            SegmentTypeId = s.segment_type_id
        }).ToList();
        return result;
    }

    public async Task<List<SegmentDto>> GetAllByTripIdAsync(int userId, int tripId, CancellationToken cancellationToken)
    {
        var segments = await _segmentRepository_.GetAllByTripIdAsync(tripId, cancellationToken);
        if (segments.Count != 0)
        {
            await _tripRepository_.ThrowIfUserDoesntHaveAccessToTripAsync(userId, segments[0].trip_id, cancellationToken);
        }
        var result = segments.Select(s => new SegmentDto
            {
                Id = s.id,
                Cost = s.cost,
                EndDateTimeUtc = s.end_datetime_utc,
                EndDateTimeUtcOffset = s.end_datetime_utc_offset,
                Name = s.name,
                StartDateTimeUtc = s.start_datetime_utc,
                StartDateTimeUtcOffset = s.start_datetime_utc_offset,
                TripId = s.trip_id,
                SegmentTypeId = s.segment_type_id
            })
            .OrderBy(s => s.StartDateTimeUtc)
            .ToList();
        return result;
    }

    public async Task<SegmentDto?> GetAsync(int userId, int segmentId, CancellationToken cancellationToken)
    {
        var segment = await _segmentRepository_.GetAsync(segmentId, cancellationToken);
        if (segment != null)
        {
            await _tripRepository_.ThrowIfUserDoesntHaveAccessToTripAsync(userId, segment.trip_id, cancellationToken);
        }
        var result = segment == null ? null : new SegmentDto
        {
            Id = segment.id,
            Cost = segment.cost,
            EndDateTimeUtc = segment.end_datetime_utc,
            EndDateTimeUtcOffset = segment.end_datetime_utc_offset,
            Name = segment.name,
            StartDateTimeUtc = segment.start_datetime_utc,
            StartDateTimeUtcOffset = segment.start_datetime_utc_offset,
            TripId = segment.trip_id,
            SegmentTypeId = segment.segment_type_id
        };
        return result;
    }

    public async Task CreateAsync(int userId, SegmentDto segment, CancellationToken cancellationToken)
    {
        await _tripRepository_.ThrowIfUserDoesntHaveAccessToTripAsync(userId, segment.TripId, cancellationToken);
        var utcStart = ConvertWithOffset(segment.StartDateTimeUtc, segment.StartDateTimeUtcOffset);
        var utcEnd = ConvertWithOffset(segment.EndDateTimeUtc, segment.EndDateTimeUtcOffset);
        await _segmentRepository_.CreateAsync(new SegmentDbm
        {
            trip_id = segment.TripId,
            start_datetime_utc = utcStart,
            start_datetime_utc_offset = segment.StartDateTimeUtcOffset,
            end_datetime_utc = utcEnd,
            end_datetime_utc_offset = segment.EndDateTimeUtcOffset,
            name = segment.Name,
            cost = segment.Cost,
            segment_type_id = segment.SegmentTypeId
        }, cancellationToken);
    }

    public async Task UpdateAsync(int userId, SegmentDto segment, CancellationToken cancellationToken)
    {
        await _tripRepository_.ThrowIfUserDoesntHaveAccessToTripAsync(userId, segment.TripId, cancellationToken);
        var utcStart = ConvertWithOffset(segment.StartDateTimeUtc, segment.StartDateTimeUtcOffset);
        var utcEnd = ConvertWithOffset(segment.EndDateTimeUtc, segment.EndDateTimeUtcOffset);
        await _segmentRepository_.UpdateAsync(new SegmentDbm
        {
            id = segment.Id,
            trip_id = segment.TripId,
            start_datetime_utc = utcStart,
            start_datetime_utc_offset = segment.StartDateTimeUtcOffset,
            end_datetime_utc = utcEnd,
            end_datetime_utc_offset = segment.EndDateTimeUtcOffset,
            name = segment.Name,
            cost = segment.Cost,
            segment_type_id = segment.SegmentTypeId
        }, cancellationToken);

        await UpdateOptionsRelatedBySegmentIdAsync(userId, segment.Id, cancellationToken);
    }

    public async Task DeleteAsync(int userId, int segmentId, CancellationToken cancellationToken)
    {
        var segment = await _segmentRepository_.GetAsync(segmentId, cancellationToken);
        if (segment == null)
        {
            throw new Exception("Segment not found");
        }
        await _tripRepository_.ThrowIfUserDoesntHaveAccessToTripAsync(userId, segment.trip_id, cancellationToken);
        await _segmentRepository_.DeleteAsync(segmentId, cancellationToken);
        await UpdateOptionsRelatedBySegmentIdAsync(userId, segmentId, cancellationToken);
    }

    public async Task ConnectSegmentWithOptionsAsync(int userId, UpdateConnectedOptionsAm am, CancellationToken cancellationToken)
    {
        await _tripRepository_.ThrowIfUserDoesntHaveAccessToTripAsync(userId, am.TripId, cancellationToken);
        await _segmentRepository_.ConnectSegmentsWithOptionAsync(am.SegmentId, am.OptionIds, cancellationToken);
        await UpdateOptionsRelatedBySegmentIdAsync(userId, am.SegmentId, cancellationToken);
    }

    private async Task UpdateOptionsRelatedBySegmentIdAsync(int userId, int segmentId, CancellationToken cancellationToken)
    {
        var segmentOptions = await _optionService_.GetAllBySegmentIdAsync(userId, segmentId, cancellationToken);
        if (segmentOptions.Count != 0)
        {
            await _tripRepository_.ThrowIfUserDoesntHaveAccessToTripAsync(userId, segmentOptions[0].TripId, cancellationToken);
            foreach (var option in segmentOptions)
            {
                await _optionService_.RecalculateOptionStateAsync(userId, option.Id, cancellationToken);
            }
        }
    }

    public async Task<List<OptionDto>> GetConnectedOptionsAsync(int userId, int segmentId, CancellationToken cancellationToken)
    {
        var options = await _optionRepository_.GetAllConnectedToSegmentIdAsync(segmentId, cancellationToken);
        if (options.Count != 0)
        {
            await _tripRepository_.ThrowIfUserDoesntHaveAccessToTripAsync(userId, options[0].trip_id, cancellationToken);
            var result = options.Select(o => new OptionDto
            {
                Id = o.id,
                Name = o.name,
                TripId = o.trip_id
            }).ToList();
            return result;
        }
        return new List<OptionDto>();
    }

    public async Task<List<SegmentTypeDto>> GetAllSegmentTypesAsync(CancellationToken cancellationToken)
    {
        var segmentTypes = await _segmentRepository_.GetAllSegmentTypesAsync(cancellationToken);
        var result = segmentTypes.Select(st => new SegmentTypeDto
        {
            Id = st.id,
            ShortName = st.short_name,
            Name = st.name,
            Description = st.description,
            Color = st.color,
            IconSvg = st.icon_svg
        }).ToList();
        return result;
    }

    private DateTime ConvertWithOffset(DateTime dateOriginal, int offset)
    {
        var converted = dateOriginal.AddHours(-1 * offset);
        // -1 because people set the time in selected timezone, 
        // but we need to convert it to utc
        var utc = new DateTime(converted.Ticks, DateTimeKind.Utc);
        return utc;
    }
}