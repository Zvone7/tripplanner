using Domain.DbModels;
using Domain.Dtos;

namespace Application.Services;

public class TripService
{
    private readonly TripRepository _tripRepository_;

    public TripService(TripRepository tripRepository)
    {
        _tripRepository_ = tripRepository;
    }

    public async Task<List<TripDto>> GetAllAsync(int userId, CancellationToken cancellationToken)
    {
        var trips = await _tripRepository_.GetAllActiveAsync(userId, cancellationToken);
        var result = trips.Select(t => new TripDto
        {
            Id = t.Id,
            Name = t.Name,
            Description = t.Description,
            IsActive = t.is_active
        }).ToList();
        return result;
    }

    public async Task<TripDto?> GetAsync(int userId, int tripId, CancellationToken cancellationToken)
    {
        var trip = await _tripRepository_.GetAsync(userId, tripId, cancellationToken);
        var result = trip == null ? null : new TripDto
        {
            Id = trip.Id,
            Name = trip.Name,
            Description = trip.Description,
            IsActive = trip.is_active
        };
        return result;
    }

    public async Task<TripDto> CreateAsync(int userId, TripDto trip, CancellationToken cancellationToken)
    {
        var created = await _tripRepository_.CreateAsync(userId,
            new TripDbm
            {
                Name = trip.Name,
                Description = trip.Description,
                is_active = trip.IsActive
            }, cancellationToken);

        var result = new TripDto
        {
            Id = created.Id,
            Name = created.Name,
            Description = created.Description,
            IsActive = created.is_active
        };

        return result;
    }

    public async Task<TripDto> UpdateAsync(int userId, TripDto trip, CancellationToken cancellationToken)
    {
        var updated = await _tripRepository_.UpdateAsync(userId, new TripDbm
        {
            Id = trip.Id,
            Name = trip.Name,
            Description = trip.Description,
            is_active = trip.IsActive
        }, cancellationToken);

        var result = new TripDto
        {
            Id = updated.Id,
            Name = updated.Name,
            Description = updated.Description,
            IsActive = updated.is_active
        };

        return result;
    }

    public async Task DeleteTripAsync(int userId, int tripId, CancellationToken cancellationToken)
    {
        await _tripRepository_.DeleteAsync(userId, tripId, cancellationToken);
    }

}