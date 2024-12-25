using Application.Services;
using Domain.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Web.Controllers;

[Route($"api/[controller]")]
[Authorize]
[ApiController]
public class TripController : ControllerBase
{
    private readonly TripService _tripService_;

    public TripController(TripService tripService)
    {
        _tripService_ = tripService;
    }

    [HttpGet]
    [Route(nameof(GetAllTrips))]
    public async Task<ActionResult<List<TripDto>>> GetAllTrips(CancellationToken cancellationToken)
    {
        var userId = HttpContextExtensions.GetUserId(HttpContext);
        if (userId == null) return Unauthorized("User not found");
        return await _tripService_.GetAllAsync(userId.Value, cancellationToken);
    }

    [HttpGet]
    [Route(nameof(GetTripById))]
    public async Task<ActionResult<TripDto?>> GetTripById(int id, CancellationToken cancellationToken)
    {
        var userId = HttpContextExtensions.GetUserId(HttpContext);
        if (userId == null) return Unauthorized("User not found");
        return await _tripService_.GetAsync(userId.Value, id, cancellationToken);
    }

    [HttpPost]
    [Route(nameof(CreateTrip))]
    public async Task<ActionResult> CreateTrip(TripDto trip, CancellationToken cancellationToken)
    {
        var userId = HttpContextExtensions.GetUserId(HttpContext);
        if (userId == null) return Unauthorized("User not found");
        await _tripService_.CreateAsync(userId.Value, trip, cancellationToken);
        return Ok();
    }

    [HttpPut]
    [Route(nameof(UpdateTrip))]
    public async Task<ActionResult> UpdateTrip(TripDto trip, CancellationToken cancellationToken)
    {
        var userId = HttpContextExtensions.GetUserId(HttpContext);
        if (userId == null) return Unauthorized("User not found");
        await _tripService_.UpdateAsync(userId.Value, trip, cancellationToken);
        return Ok();
    }

    [HttpDelete]
    [Route(nameof(DeleteTrip))]
    public async Task<ActionResult> DeleteTrip(int id, CancellationToken cancellationToken)
    {
        var userId = HttpContextExtensions.GetUserId(HttpContext);
        if (userId == null) return Unauthorized("User not found");
        await _tripService_.DeleteTripAsync(userId.Value, id, cancellationToken);
        return Ok();
    }
}