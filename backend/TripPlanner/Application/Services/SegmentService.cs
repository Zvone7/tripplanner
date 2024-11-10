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
        return segments.Select(s => new SegmentDto
        {
            Id = s.id,
            Cost = s.cost,
            EndTime = s.end_time,
            Nickname = s.nickname,
            StartTime = s.start_time,
            TripId = s.trip_id
        }).ToList();
    }

    public async Task<List<SegmentDto>> GetAllByTripIdAsync(int tripId, CancellationToken cancellationToken)
    {
        var segments = await _segmentRepository.GetAllByTripIdAsync(tripId, cancellationToken);
        return segments.Select(s => new SegmentDto
            {
                Id = s.id,
                Cost = s.cost,
                EndTime = s.end_time,
                Nickname = s.nickname,
                StartTime = s.start_time,
                TripId = s.trip_id
            })
            .OrderBy(s => s.StartTime)
            .ToList();
    }

    public async Task<SegmentDto?> GetAsync(int segmentId, CancellationToken cancellationToken)
    {
        var segment = await _segmentRepository.GetAsync(segmentId, cancellationToken);
        return segment == null ? null : new SegmentDto
        {
            Id = segment.id,
            Cost = segment.cost,
            EndTime = segment.end_time,
            Nickname = segment.nickname,
            StartTime = segment.start_time,
            TripId = segment.trip_id
        };
    }

    public async Task CreateAsync(SegmentDto segment, CancellationToken cancellationToken)
    {
        await _segmentRepository.CreateAsync(new SegmentDbm
        {
            trip_id = segment.TripId,
            start_time = segment.StartTime.Value,
            end_time = segment.EndTime.Value,
            nickname = segment.Nickname,
            cost = segment.Cost
        }, cancellationToken);
    }

    public async Task UpdateAsync(SegmentDto segment, CancellationToken cancellationToken)
    {
        await _segmentRepository.UpdateAsync(new SegmentDbm
        {
            id = segment.Id,
            trip_id = segment.TripId,
            start_time = segment.StartTime.Value,
            end_time = segment.EndTime.Value,
            nickname = segment.Nickname,
            cost = segment.Cost
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
        return options.Select(o => new OptionDto
        {
            Id = o.id,
            Name = o.nickname,
            TripId = o.trip_id
        }).ToList();
    }
}