using Domain.ActionModels;
using Domain.DbModels;
using Domain.Dtos;

namespace Application.Services;

public class OptionService
{
    private readonly OptionRepository _optionRepository;
    private readonly SegmentRepository _segmentRepository_;

    public OptionService(
        OptionRepository optionRepository,
        SegmentRepository segmentRepository)
    {
        _optionRepository = optionRepository;
        _segmentRepository_ = segmentRepository;
    }
    public async Task<List<OptionDto>> GetAllByTripIdAsync(int tripId, CancellationToken cancellationToken)
    {
        var options = await _optionRepository.GetOptionsByTripIdAsync(tripId, cancellationToken);
        return options.Select(o => new OptionDto
            {
                Id = o.id,
                Name = o.nickname,
                StartDate = o.start_date,
                EndDate = o.end_date,
                TripId = o.trip_id,
                TotalCost = o.total_cost
            })
            .OrderBy(s => s.StartDate)
            .ToList();
    }

    public async Task<OptionDto?> GetAsync(int optionId, CancellationToken cancellationToken)
    {
        var option = await _optionRepository.GetAsync(optionId, cancellationToken);
        return option == null ? null : new OptionDto
        {
            Id = option.id,
            Name = option.nickname,
            StartDate = option.start_date,
            EndDate = option.end_date,
            TripId = option.trip_id,
            TotalCost = option.total_cost
        };
    }

    public async Task CreateAsync(OptionDto option, CancellationToken cancellationToken)
    {
        await _optionRepository.CreateAsync(new TripOptionDbm
        {
            nickname = option.Name,
            start_date = null,
            end_date = null,
            trip_id = option.TripId,
            total_cost = 0
        }, cancellationToken);
    }
    public async Task UpdateAsync(OptionDto option, CancellationToken cancellationToken)
    {
        await _optionRepository.UpdateAsync(new TripOptionDbm
        {
            id = option.Id,
            nickname = option.Name,
            start_date = option.StartDate,
            end_date = option.EndDate,
            trip_id = option.TripId,
            total_cost = option.TotalCost
        }, cancellationToken);
    }

    public async Task UpdateAsync(UpdateOptionAm option, CancellationToken cancellationToken)
    {
        await _optionRepository.UpdateAsync(new TripOptionDbm
        {
            id = option.Id,
            nickname = option.Name
        }, cancellationToken);
    }

    public async Task DeleteAsync(int optionId, CancellationToken cancellationToken)
    {
        await _optionRepository.DeleteAsync(optionId, cancellationToken);
    }

    public async Task RecalculateOptionStateAsync(int optionId, CancellationToken cancellationToken)
    {
        var segmentsForOption = await _segmentRepository_.GetAllByOptionIdAsync(optionId, cancellationToken);
        var option = await GetAsync(optionId, cancellationToken);

        if (option == null)
            throw new InvalidDataException($"Option with id {optionId} not found.");

        option.TotalCost = segmentsForOption.Sum(s => s.cost);
        option.StartDate = segmentsForOption.Min(s => s.start_time);
        option.EndDate = segmentsForOption.Max(s => s.start_time);

        await UpdateAsync(option, cancellationToken);
    }

    public async Task<List<OptionDto>> GetAllBySegmentIdAsync(int segmentId, CancellationToken cancellationToken)
    {
        var options = await _optionRepository.GetOptionsBySegmentIdAsync(segmentId, cancellationToken);
        return options.Select(o => new OptionDto
        {
            Id = o.id,
            Name = o.nickname,
            StartDate = o.start_date,
            EndDate = o.end_date,
            TripId = o.trip_id,
            TotalCost = o.total_cost
        }).ToList();
    }

    public async Task ConnectOptionWithSegmentsAsync(UpdateConnectedSegmentsAm am, CancellationToken cancellationToken)
    {
        await _optionRepository.ConnectOptionWithSegmentsAsync(am.OptionId, am.SegmentIds, cancellationToken);
        await RecalculateOptionStateAsync(am.OptionId, cancellationToken);
    }

    public async Task<List<SegmentDto>> GetConnectedSegmentsAsync(int optionId, CancellationToken cancellationToken)
    {
        var segments = await _segmentRepository_.GetAllByOptionIdAsync(optionId, cancellationToken);
        return segments.Select(s => new SegmentDto
        {
            Id = s.id,
            TripId = s.trip_id,
            StartTime = s.start_time,
            EndTime = s.end_time,
            Nickname = s.nickname,
            Cost = s.cost
        }).ToList();
    }
}