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
        return await _tripService.GetAllTripsAsync(cancellationToken);
    }

    [HttpGet]
    [Route(nameof(GetTripById))]
    public async Task<TripDto?> GetTripById(int id, CancellationToken cancellationToken)
    {
        return await _tripService.GetTripByIdAsync(id, cancellationToken);
    }

    [HttpPost]
    [Route(nameof(AddTrip))]
    public async Task AddTrip(TripDto trip, CancellationToken cancellationToken)
    {
        await _tripService.AddTripAsync(trip, cancellationToken);
    }

    [HttpPut]
    [Route(nameof(UpdateTrip))]
    public async Task UpdateTrip(TripDto trip, CancellationToken cancellationToken)
    {
        await _tripService.UpdateTripAsync(trip, cancellationToken);
    }
}