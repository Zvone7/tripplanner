using Domain.DbModels;
using Domain.Dtos;

namespace Application.Services;

public class OptionService{
    private readonly OptionRepository _optionRepository;

    public OptionService(OptionRepository optionRepository)
    {
        _optionRepository = optionRepository;
    }
    public async Task<List<OptionDto>> GetOptionsByTripIdAsync(int tripId, CancellationToken cancellationToken)
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
        }).ToList();
    }

    public async Task<OptionDto?> GetOptionByIdAsync(int id, CancellationToken cancellationToken)
    {
        var option = await _optionRepository.GetOptionByIdAsync(id, cancellationToken);
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

    public async Task CreateOptionAsync(OptionDto option, CancellationToken cancellationToken)
    {
        await _optionRepository.AddOptionAsync(new TripOptionDbm
        {
            nickname = option.Name,
            start_date = option.StartDate,
            end_date = option.EndDate,
            trip_id = option.TripId,
            total_cost = option.TotalCost
        }, cancellationToken);
    }

    public async Task UpdateOptionAsync(OptionDto option, CancellationToken cancellationToken)
    {
        await _optionRepository.UpdateOptionAsync(new TripOptionDbm
        {
            id = option.Id,
            nickname = option.Name,
            start_date = option.StartDate,
            end_date = option.EndDate,
            trip_id = option.TripId,
            total_cost = option.TotalCost
        }, cancellationToken);
    }

    public async Task DeleteOptionAsync(int id, CancellationToken cancellationToken)
    {
        await _optionRepository.DeleteOptionAsync(id, cancellationToken);
    }
}