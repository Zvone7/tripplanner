using Domain.DbModels;
using Domain.Dtos;

namespace Application.Services;

public class SegmentService{
    private readonly SegmentRepository _segmentRepository;

    public SegmentService(SegmentRepository segmentRepository)
    {
        _segmentRepository = segmentRepository;
    }

    public async Task<List<SegmentDto>> GetSegmentsByOptionIdAsync(int optionId, CancellationToken cancellationToken)
    {
        var segments = await _segmentRepository.GetSegmentsByOptionIdAsync(optionId, cancellationToken);
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

    public async Task<List<SegmentDto>> GetSegmentsByTripIdAsync(int tripId, CancellationToken cancellationToken)
    {
        var segments = await _segmentRepository.GetSegmentsByTripIdAsync(tripId, cancellationToken);
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

    public async Task<SegmentDto?> GetSegmentByIdAsync(int id, CancellationToken cancellationToken)
    {
        var segment = await _segmentRepository.GetSegmentByIdAsync(id, cancellationToken);
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

    public async Task CreateSegmentAsync(SegmentDto segment, CancellationToken cancellationToken)
    {
        await _segmentRepository.CreateSegmentAsync(new SegmentDbm
        {
            trip_id = segment.TripId,
            start_time = segment.StartTime.Value,
            end_time = segment.EndTime.Value,
            nickname = segment.Nickname,
            cost = segment.Cost
        }, cancellationToken);
    }

    public async Task UpdateSegmentAsync(SegmentDto segment, CancellationToken cancellationToken)
    {
        await _segmentRepository.UpdateSegmentAsync(new SegmentDbm
        {
            id = segment.Id,
            trip_id = segment.TripId,
            start_time = segment.StartTime.Value,
            end_time = segment.EndTime.Value,
            nickname = segment.Nickname,
            cost = segment.Cost
        }, cancellationToken);
    }

    public async Task DeleteSegmentAsync(int id, CancellationToken cancellationToken)
    {
        await _segmentRepository.DeleteSegmentAsync(id, cancellationToken);
    }
}