using Domain.DbModels;
using Domain.Dtos;

namespace Application.Services;

public class TripService
{
    private readonly TripRepository _tripRepository;
    private readonly OptionRepository _optionRepository;

    public TripService(TripRepository tripRepository, OptionRepository optionRepository)
    {
        _tripRepository = tripRepository;
        _optionRepository = optionRepository;
    }

    public async Task<List<TripDto>> GetAllTripsAsync(CancellationToken cancellationToken)
    {
        var trips = await _tripRepository.GetAllTripsAsync(cancellationToken);
        return trips.Select(t => new TripDto
        {
            Id = t.Id,
            Name = t.Name,
            Description = t.Description,
            IsActive = t.is_active
        }).ToList();
    }

    public async Task<TripDto?> GetTripByIdAsync(int id, CancellationToken cancellationToken)
    {
        var trip = await _tripRepository.GetTripByIdAsync(id, cancellationToken);
        return trip == null ? null : new TripDto
        {
            Id = trip.Id,
            Name = trip.Name,
            Description = trip.Description,
            IsActive = trip.is_active
        };
    }

    public async Task<TripDto> CreateTripAsync(TripDto trip, CancellationToken cancellationToken)
    {
        var created = await _tripRepository.CreateTripAsync(new TripDbm
        {
            Name = trip.Name,
            Description = trip.Description,
            is_active = trip.IsActive
        }, cancellationToken);
        return new TripDto
        {
            Id = created.Id,
            Name = created.Name,
            Description = created.Description,
            IsActive = created.is_active
        };
    }

    public async Task<TripDto> UpdateTripAsync(TripDto trip, CancellationToken cancellationToken)
    {
        var updated = await _tripRepository.UpdateTripAsync(new TripDbm
        {
            Id = trip.Id,
            Name = trip.Name,
            Description = trip.Description,
            is_active = trip.IsActive
        }, cancellationToken);
        return new TripDto
        {
            Id = updated.Id,
            Name = updated.Name,
            Description = updated.Description,
            IsActive = updated.is_active
        };
        
    }

    public async Task DeleteTripAsync(int id, CancellationToken cancellationToken)
    {
        await _tripRepository.DeleteTripAsync(id, cancellationToken);
    }

}