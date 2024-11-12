using Domain.ActionModels;
using Domain.DbModels;
using Domain.Dtos;

namespace Application.Services;

public class SegmentService
{
    private readonly SegmentRepository _segmentRepository;
    private readonly OptionRepository _optionRepository_;
    private readonly OptionService _optionService_;

    public SegmentService(
        SegmentRepository segmentRepository,
        OptionRepository optionRepository,
        OptionService optionService)
    {
        _segmentRepository = segmentRepository;
        _optionRepository_ = optionRepository;
        _optionService_ = optionService;
    }

    public async Task<List<SegmentDto>> GetAllByOptionIdAsync(int optionId, CancellationToken cancellationToken)
    {
        var segments = await _segmentRepository.GetAllByOptionIdAsync(optionId, cancellationToken);
        var result = segments.Select(s => new SegmentDto
        {
            Id = s.id,
            Cost = s.cost,
            EndDateTimeUtc = s.end_datetime_utc,
            Name = s.name,
            StartDateTimeUtc = s.start_datetime_utc,
            TripId = s.trip_id,
            SegmentTypeId = s.segment_type_id
        }).ToList();
        return result;
    }

    public async Task<List<SegmentDto>> GetAllByTripIdAsync(int tripId, CancellationToken cancellationToken)
    {
        var segments = await _segmentRepository.GetAllByTripIdAsync(tripId, cancellationToken);
        var result = segments.Select(s => new SegmentDto
            {
                Id = s.id,
                Cost = s.cost,
                EndDateTimeUtc = s.end_datetime_utc,
                Name = s.name,
                StartDateTimeUtc = s.start_datetime_utc,
                TripId = s.trip_id,
                SegmentTypeId = s.segment_type_id
            })
            .OrderBy(s => s.StartDateTimeUtc)
            .ToList();
        return result;
    }

    public async Task<SegmentDto?> GetAsync(int segmentId, CancellationToken cancellationToken)
    {
        var segment = await _segmentRepository.GetAsync(segmentId, cancellationToken);
        var result = segment == null ? null : new SegmentDto
        {
            Id = segment.id,
            Cost = segment.cost,
            EndDateTimeUtc = segment.end_datetime_utc,
            Name = segment.name,
            StartDateTimeUtc = segment.start_datetime_utc,
            TripId = segment.trip_id,
            SegmentTypeId = segment.segment_type_id
        };
        return result;
    }

    public async Task CreateAsync(SegmentDto segment, CancellationToken cancellationToken)
    {
        await _segmentRepository.CreateAsync(new SegmentDbm
        {
            trip_id = segment.TripId,
            start_datetime_utc = segment.StartDateTimeUtc.Value,
            end_datetime_utc = segment.EndDateTimeUtc.Value,
            name = segment.Name,
            cost = segment.Cost,
            segment_type_id = segment.SegmentTypeId
        }, cancellationToken);
    }

    public async Task UpdateAsync(SegmentDto segment, CancellationToken cancellationToken)
    {
        await _segmentRepository.UpdateAsync(new SegmentDbm
        {
            id = segment.Id,
            trip_id = segment.TripId,
            start_datetime_utc = segment.StartDateTimeUtc.Value,
            end_datetime_utc = segment.EndDateTimeUtc.Value,
            name = segment.Name,
            cost = segment.Cost,
            segment_type_id = segment.SegmentTypeId
        }, cancellationToken);

        await UpdateOptionsRelatedBySegmentIdAsync(segment.Id, cancellationToken);
    }

    public async Task DeleteAsync(int segmentId, CancellationToken cancellationToken)
    {
        await _segmentRepository.DeleteAsync(segmentId, cancellationToken);
        await UpdateOptionsRelatedBySegmentIdAsync(segmentId, cancellationToken);
    }

    public async Task ConnectSegmentWithOptionsAsync(UpdateConnectedOptionsAm am, CancellationToken cancellationToken)
    {
        await _segmentRepository.ConnectSegmentsWithOptionAsync(am.SegmentId, am.OptionIds, cancellationToken);
        await UpdateOptionsRelatedBySegmentIdAsync(am.SegmentId, cancellationToken);
    }

    private async Task UpdateOptionsRelatedBySegmentIdAsync(int segmentId, CancellationToken cancellationToken)
    {
        var segmentOptions = await _optionService_.GetAllBySegmentIdAsync(segmentId, cancellationToken);
        foreach (var option in segmentOptions)
        {
            await _optionService_.RecalculateOptionStateAsync(option.Id, cancellationToken);
        }
    }

    public async Task<List<OptionDto>> GetConnectedOptionsAsync(int segmentId, CancellationToken cancellationToken)
    {
        var options = await _optionRepository_.GetAllConnectedToSegmentIdAsync(segmentId, cancellationToken);
        var result = options.Select(o => new OptionDto
        {
            Id = o.id,
            Name = o.name,
            TripId = o.trip_id
        }).ToList();
        return result;
    }

    public async Task<List<SegmentTypeDto>> GetAllSegmentTypesAsync(CancellationToken cancellationToken)
    {
        var segmentTypes = await _segmentRepository.GetAllSegmentTypesAsync(cancellationToken);
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
}