using Domain.ActionModels;
using Domain.DbModels;
using Domain.Dtos;

namespace Application.Services;

public class OptionService
{
    private readonly OptionRepository _optionRepository_;
    private readonly SegmentRepository _segmentRepository_;

    public OptionService(
        OptionRepository optionRepository,
        SegmentRepository segmentRepository)
    {
        _optionRepository_ = optionRepository;
        _segmentRepository_ = segmentRepository;
    }

    public async Task<List<OptionDto>> GetAllByTripIdAsync(int tripId, CancellationToken ct)
    {
        var options = await _optionRepository_.GetOptionsByTripIdAsync(tripId, ct);
        var list = new List<OptionDto>(options.Count);

        foreach (var o in options)
        {
            var dto = new OptionDto
            {
                Id = o.id,
                Name = o.name,
                StartDateTimeUtc = o.start_datetime_utc,
                EndDateTimeUtc = o.end_datetime_utc,
                TripId = o.trip_id,
                TotalCost = o.total_cost,
                IsUiVisible = o.is_ui_visible
            };

            var segments = await _segmentRepository_.GetAllByOptionIdAsync(o.id, ct);

            var final = await RecalculateFeDisplayDataAsync(dto, segments, ct);
            list.Add(final);
        }

        return list
            .OrderBy(x => x.StartDateTimeUtc)
            .ToList();
    }


    public async Task<OptionDto?> GetAsync(int optionId, CancellationToken cancellationToken)
    {
        var option = await _optionRepository_.GetAsync(optionId, cancellationToken);
        var result = option == null
            ? null
            : new OptionDto
            {
                Id = option.id,
                Name = option.name,
                StartDateTimeUtc = option.start_datetime_utc,
                EndDateTimeUtc = option.end_datetime_utc,
                TripId = option.trip_id,
                TotalCost = option.total_cost,
                IsUiVisible = option.is_ui_visible
            };
        return result;
    }

    public async Task CreateAsync(OptionDto option, CancellationToken cancellationToken)
    {
        await _optionRepository_.CreateAsync(new TripOptionDbm
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
        await _optionRepository_.UpdateAsync(new TripOptionDbm
        {
            id = option.Id,
            name = option.Name,
            start_datetime_utc = option.StartDateTimeUtc,
            end_datetime_utc = option.EndDateTimeUtc,
            trip_id = option.TripId,
            total_cost = option.TotalCost,
            is_ui_visible = option.IsUiVisible
        }, cancellationToken);
    }

    public async Task UpdateAsync(UpdateOptionAm option, CancellationToken cancellationToken)
    {
        await _optionRepository_.UpdateLightAsync(new TripOptionDbm
        {
            id = option.Id,
            name = option.Name,
            is_ui_visible = option.IsUiVisible,
        }, cancellationToken);
    }

    public async Task DeleteAsync(int optionId, CancellationToken cancellationToken)
    {
        var option = await _optionRepository_.GetAsync(optionId, cancellationToken);
        if (option == null)
            throw new InvalidDataException($"Option with id {optionId} not found.");
        await _optionRepository_.DeleteAsync(optionId, cancellationToken);
    }

    public async Task<OptionDto> RecalculateOptionStateAsync(int optionId, CancellationToken cancellationToken)
    {
        var segmentsForOption = await _segmentRepository_.GetAllByOptionIdAsync(optionId, cancellationToken);
        var option = await GetAsync(optionId, cancellationToken);
        if (option == null)
            throw new InvalidDataException($"Option with id {optionId} not found.");

        if (segmentsForOption.Count == 0)
        {
            option.TotalCost = 0;
            option.StartDateTimeUtc = null;
            option.EndDateTimeUtc = null;
            return await RecalculateFeDisplayDataAsync(option, segmentsForOption, cancellationToken);
        }

        option.TotalCost = segmentsForOption.Sum(s => s.cost);
        option.StartDateTimeUtc = segmentsForOption.Min(s => s.start_datetime_utc);
        option.EndDateTimeUtc = segmentsForOption.Max(s => s.start_datetime_utc);
        var updated = await RecalculateFeDisplayDataAsync(option, segmentsForOption, cancellationToken);

        return updated;
    }

    private async Task<OptionDto> RecalculateFeDisplayDataAsync(OptionDto option, List<SegmentDbm> segmentsForOption, CancellationToken cancellationToken)
    {
        var segmentTypes = await _segmentRepository_.GetAllSegmentTypesAsync(cancellationToken);
        var totalDays = (option.EndDateTimeUtc - option.StartDateTimeUtc)?.TotalDays;
        option.TotalDays = totalDays.HasValue && totalDays > 0 ? (int)Math.Ceiling(totalDays.Value) : 1;
        option.CostPerDay = option.TotalCost / option.TotalDays;
        var transportSegmentTypes = segmentTypes.Where(st => st.short_name.ToLower().Contains("transport")).Select(st => st.id).ToHashSet();
        var accomodationSegmentTypes = segmentTypes.Where(st => st.short_name.ToLower().Contains("accomodation")).Select(st => st.id).ToHashSet();
        var dictionaryOfCosts = new Dictionary<CostType, decimal>
        {
            { CostType.Transport, segmentsForOption.Where(s => transportSegmentTypes.Contains(s.segment_type_id)).Sum(s => s.cost) },
            { CostType.Accommodation, segmentsForOption.Where(s => accomodationSegmentTypes.Contains(s.segment_type_id)).Sum(s => s.cost) },
            { CostType.Other, segmentsForOption.Where(s => !transportSegmentTypes.Contains(s.segment_type_id) && !accomodationSegmentTypes.Contains(s.segment_type_id)).Sum(s => s.cost) }
        };
        option.CostPerType = dictionaryOfCosts;

        return option;
    }

    public async Task<List<OptionDto>> GetAllBySegmentIdAsync(int segmentId, CancellationToken cancellationToken)
    {
        var options = await _optionRepository_.GetOptionsBySegmentIdAsync(segmentId, cancellationToken);
        var result = options.Select(o => new OptionDto
        {
            Id = o.id,
            Name = o.name,
            StartDateTimeUtc = o.start_datetime_utc,
            EndDateTimeUtc = o.end_datetime_utc,
            TripId = o.trip_id,
            TotalCost = o.total_cost,
            IsUiVisible = o.is_ui_visible
        }).ToList();
        return result;
    }

    public async Task ConnectOptionWithSegmentsAsync(UpdateConnectedSegmentsAm am, CancellationToken cancellationToken)
    {
        var option = await _optionRepository_.GetAsync(am.OptionId, cancellationToken);
        if (option == null)
            throw new InvalidDataException($"Option with id {am.OptionId} not found.");
        await _optionRepository_.ConnectOptionWithSegmentsAsync(am.OptionId, am.SegmentIds, cancellationToken);
        var optionFinal = await RecalculateOptionStateAsync(am.OptionId, cancellationToken);
        await UpdateAsync(optionFinal, cancellationToken);
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
            Cost = s.cost,
            SegmentTypeId = s.segment_type_id,
            IsUiVisible = s.is_ui_visible,
            CurrencyId = s.currency_id,
        }).ToList();
        return result;
    }
}
