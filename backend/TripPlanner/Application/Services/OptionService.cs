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
        var result = options.Select(o => new OptionDto
            {
                Id = o.id,
                Name = o.name,
                StartDateTimeUtc = o.start_datetime_utc,
                EndDateTimeUtc = o.end_datetime_utc,
                TripId = o.trip_id,
                TotalCost = o.total_cost
            })
            .OrderBy(s => s.StartDateTimeUtc)
            .ToList();
        return result;
    }

    public async Task<OptionDto?> GetAsync(int optionId, CancellationToken cancellationToken)
    {
        var option = await _optionRepository.GetAsync(optionId, cancellationToken);
        var result = option == null ? null : new OptionDto
        {
            Id = option.id,
            Name = option.name,
            StartDateTimeUtc = option.start_datetime_utc,
            EndDateTimeUtc = option.end_datetime_utc,
            TripId = option.trip_id,
            TotalCost = option.total_cost
        };
        return result;
    }

    public async Task CreateAsync(OptionDto option, CancellationToken cancellationToken)
    {
        await _optionRepository.CreateAsync(new TripOptionDbm
        {
            name = option.Name,
            start_datetime_utc = null,
            end_datetime_utc = null,
            trip_id = option.TripId,
            total_cost = 0
        }, cancellationToken);
    }
    public async Task UpdateAsync(OptionDto option, CancellationToken cancellationToken)
    {
        await _optionRepository.UpdateAsync(new TripOptionDbm
        {
            id = option.Id,
            name = option.Name,
            start_datetime_utc = option.StartDateTimeUtc,
            end_datetime_utc = option.EndDateTimeUtc,
            trip_id = option.TripId,
            total_cost = option.TotalCost
        }, cancellationToken);
    }

    public async Task UpdateAsync(UpdateOptionAm option, CancellationToken cancellationToken)
    {
        await _optionRepository.UpdateAsync(new TripOptionDbm
        {
            id = option.Id,
            name = option.Name
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
        option.StartDateTimeUtc = segmentsForOption.Min(s => s.start_datetime_utc);
        option.EndDateTimeUtc = segmentsForOption.Max(s => s.start_datetime_utc);

        await UpdateAsync(option, cancellationToken);
    }

    public async Task<List<OptionDto>> GetAllBySegmentIdAsync(int segmentId, CancellationToken cancellationToken)
    {
        var options = await _optionRepository.GetOptionsBySegmentIdAsync(segmentId, cancellationToken);
        var result = options.Select(o => new OptionDto
        {
            Id = o.id,
            Name = o.name,
            StartDateTimeUtc = o.start_datetime_utc,
            EndDateTimeUtc = o.end_datetime_utc,
            TripId = o.trip_id,
            TotalCost = o.total_cost
        }).ToList();
        return result;
    }

    public async Task ConnectOptionWithSegmentsAsync(UpdateConnectedSegmentsAm am, CancellationToken cancellationToken)
    {
        await _optionRepository.ConnectOptionWithSegmentsAsync(am.OptionId, am.SegmentIds, cancellationToken);
        await RecalculateOptionStateAsync(am.OptionId, cancellationToken);
    }

    public async Task<List<SegmentDto>> GetConnectedSegmentsAsync(int optionId, CancellationToken cancellationToken)
    {
        var segments = await _segmentRepository_.GetAllByOptionIdAsync(optionId, cancellationToken);
        var result = segments.Select(s => new SegmentDto
        {
            Id = s.id,
            TripId = s.trip_id,
            StartDateTimeUtc = s.start_datetime_utc,
            EndDateTimeUtc = s.end_datetime_utc,
            Name = s.name,
            Cost = s.cost
        }).ToList();
        return result;
    }
}