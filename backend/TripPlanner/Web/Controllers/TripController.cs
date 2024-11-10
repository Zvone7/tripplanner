using Application.Services;
using Domain.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace Web.Controllers;

[Route($"api/[controller]")]
[ApiController]
public class TripController{
    private readonly TripService _tripService;

    public TripController(TripService tripService)
    {
        _tripService = tripService;
    }

    [HttpGet]
    [Route(nameof(GetAllTrips))]
    public async Task<List<TripDto>> GetAllTrips(CancellationToken cancellationToken)
    {
        return await _tripService.GetAllAsync(cancellationToken);
    }

    [HttpGet]
    [Route(nameof(GetTripById))]
    public async Task<TripDto?> GetTripById(int id, CancellationToken cancellationToken)
    {
        return await _tripService.GetAsync(id, cancellationToken);
    }

    [HttpPost]
    [Route(nameof(CreateTrip))]
    public async Task CreateTrip(TripDto trip, CancellationToken cancellationToken)
    {
        await _tripService.CreateAsync(trip, cancellationToken);
    }

    [HttpPut]
    [Route(nameof(UpdateTrip))]
    public async Task UpdateTrip(TripDto trip, CancellationToken cancellationToken)
    {
        await _tripService.UpdateAsync(trip, cancellationToken);
    }

    [HttpDelete]
    [Route(nameof(DeleteTrip))]
    public async Task DeleteTrip(int id, CancellationToken cancellationToken)
    {
        await _tripService.DeleteTripAsync(id, cancellationToken);
    }
}