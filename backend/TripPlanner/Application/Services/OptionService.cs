using Domain.ActionModels;
using Domain.DbModels;
using Domain.Dtos;

namespace Application.Services;

public class OptionService
{
    private readonly TripRepository _tripRepository_;
    private readonly OptionRepository _optionRepository_;
    private readonly SegmentRepository _segmentRepository_;

    public OptionService(
        TripRepository tripRepository,
        OptionRepository optionRepository,
        SegmentRepository segmentRepository)
    {
        _tripRepository_ = tripRepository;
        _optionRepository_ = optionRepository;
        _segmentRepository_ = segmentRepository;
    }
    public async Task<List<OptionDto>> GetAllByTripIdAsync(int userId, int tripId, CancellationToken cancellationToken)
    {
        await _tripRepository_.ThrowIfUserDoesntHaveAccessToTripAsync(userId, tripId, cancellationToken);
        var options = await _optionRepository_.GetOptionsByTripIdAsync(tripId, cancellationToken);
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

    public async Task<OptionDto?> GetAsync(int userId, int optionId, CancellationToken cancellationToken)
    {
        var option = await _optionRepository_.GetAsync(optionId, cancellationToken);
        var result = option == null ? null : new OptionDto
        {
            Id = option.id,
            Name = option.name,
            StartDateTimeUtc = option.start_datetime_utc,
            EndDateTimeUtc = option.end_datetime_utc,
            TripId = option.trip_id,
            TotalCost = option.total_cost
        };
        await _tripRepository_.ThrowIfUserDoesntHaveAccessToTripAsync(userId, result.TripId, cancellationToken);
        return result;
    }

    public async Task CreateAsync(int userId, OptionDto option, CancellationToken cancellationToken)
    {
        await _tripRepository_.ThrowIfUserDoesntHaveAccessToTripAsync(userId, option.TripId, cancellationToken);
        await _optionRepository_.CreateAsync(new TripOptionDbm
        {
            name = option.Name,
            start_datetime_utc = null,
            end_datetime_utc = null,
            trip_id = option.TripId,
            total_cost = 0
        }, cancellationToken);
    }
    public async Task UpdateAsync(int userId, OptionDto option, CancellationToken cancellationToken)
    {
        await _tripRepository_.ThrowIfUserDoesntHaveAccessToTripAsync(userId, option.TripId, cancellationToken);
        await _optionRepository_.UpdateAsync(new TripOptionDbm
        {
            id = option.Id,
            name = option.Name,
            start_datetime_utc = option.StartDateTimeUtc,
            end_datetime_utc = option.EndDateTimeUtc,
            trip_id = option.TripId,
            total_cost = option.TotalCost
        }, cancellationToken);
    }

    public async Task UpdateAsync(int userId, UpdateOptionAm option, CancellationToken cancellationToken)
    {
        await _tripRepository_.ThrowIfUserDoesntHaveAccessToTripAsync(userId, option.TripId, cancellationToken);
        await _optionRepository_.UpdateLightAsync(new TripOptionDbm
        {
            id = option.Id,
            name = option.Name
        }, cancellationToken);
    }

    public async Task DeleteAsync(int userId, int optionId, CancellationToken cancellationToken)
    {
        var option = await _optionRepository_.GetAsync(optionId, cancellationToken);
        if (option == null)
            throw new InvalidDataException($"Option with id {optionId} not found.");
        await _tripRepository_.ThrowIfUserDoesntHaveAccessToTripAsync(userId, option.trip_id, cancellationToken);
        await _optionRepository_.DeleteAsync(optionId, cancellationToken);
    }

    public async Task RecalculateOptionStateAsync(int userId, int optionId, CancellationToken cancellationToken)
    {
        var segmentsForOption = await _segmentRepository_.GetAllByOptionIdAsync(optionId, cancellationToken);
        var option = await GetAsync(userId, optionId, cancellationToken);
        if (option == null)
            throw new InvalidDataException($"Option with id {optionId} not found.");

        option.TotalCost = segmentsForOption.Sum(s => s.cost);
        option.StartDateTimeUtc = segmentsForOption.Min(s => s.start_datetime_utc);
        option.EndDateTimeUtc = segmentsForOption.Max(s => s.start_datetime_utc);

        await UpdateAsync(userId, option, cancellationToken);
    }

    public async Task<List<OptionDto>> GetAllBySegmentIdAsync(int userId, int segmentId, CancellationToken cancellationToken)
    {
        var options = await _optionRepository_.GetOptionsBySegmentIdAsync(segmentId, cancellationToken);
        if (options.Count != 0)
            await _tripRepository_.ThrowIfUserDoesntHaveAccessToTripAsync(userId, options.First().trip_id, cancellationToken);
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

    public async Task ConnectOptionWithSegmentsAsync(int userId, UpdateConnectedSegmentsAm am, CancellationToken cancellationToken)
    {
        var option = await _optionRepository_.GetAsync(am.OptionId, cancellationToken);
        if (option == null)
            throw new InvalidDataException($"Option with id {am.OptionId} not found.");
        await _tripRepository_.ThrowIfUserDoesntHaveAccessToTripAsync(userId, option.trip_id, cancellationToken);
        await _optionRepository_.ConnectOptionWithSegmentsAsync(am.OptionId, am.SegmentIds, cancellationToken);
        await RecalculateOptionStateAsync(userId, am.OptionId, cancellationToken);
    }

    public async Task<List<SegmentDto>> GetConnectedSegmentsAsync(int userId, int optionId, CancellationToken cancellationToken)
    {
        var segments = await _segmentRepository_.GetAllByOptionIdAsync(optionId, cancellationToken);
        if (segments.Count != 0)
            await _tripRepository_.ThrowIfUserDoesntHaveAccessToTripAsync(userId, segments.First().trip_id, cancellationToken);
        var result = segments.Select(s => new SegmentDto
        {
            Id = s.id,
            TripId = s.trip_id,
            StartDateTimeUtc = s.start_datetime_utc,
            EndDateTimeUtc = s.end_datetime_utc,
            Name = s.name,
            Cost = s.cost,
            SegmentTypeId = s.segment_type_id
        }).ToList();
        return result;
    }
}