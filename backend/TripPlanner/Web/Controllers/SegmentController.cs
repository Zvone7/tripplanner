using Application.Services;
using Domain.ActionModels;
using Domain.DbModels;
using Domain.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Web.Controllers;

[Route($"api/[controller]")]
[Authorize]
[ApiController]
public class SegmentController : ControllerBase
{
    private readonly SegmentService _segmentService;

    public SegmentController(SegmentService segmentService)
    {
        _segmentService = segmentService;
    }

    [HttpGet]
    [Route(nameof(GetSegmentsByTripId))]
    public async Task<ActionResult<List<SegmentDto>>> GetSegmentsByTripId(int tripId, CancellationToken cancellationToken)
    {
        var userId = HttpContextExtensions.GetUserId(HttpContext);
        if (userId == null) return Unauthorized("User not found");
        return await _segmentService.GetAllByTripIdAsync(userId.Value, tripId, cancellationToken);
    }

    [HttpGet]
    [Route(nameof(GetSegmentById))]
    public async Task<ActionResult<SegmentDto?>> GetSegmentById(int id, CancellationToken cancellationToken)
    {
        var userId = HttpContextExtensions.GetUserId(HttpContext);
        if (userId == null) return Unauthorized("User not found");
        return await _segmentService.GetAsync(userId.Value, id, cancellationToken);
    }

    [HttpPost]
    [Route(nameof(CreateSegment))]
    public async Task<ActionResult> CreateSegment(SegmentDto segment, CancellationToken cancellationToken)
    {
        var userId = HttpContextExtensions.GetUserId(HttpContext);
        if (userId == null) return Unauthorized("User not found");
        await _segmentService.CreateAsync(userId.Value, segment, cancellationToken);
        return Ok();
    }

    [HttpPut]
    [Route(nameof(UpdateSegment))]
    public async Task<ActionResult> UpdateSegment(SegmentDto segment, CancellationToken cancellationToken)
    {
        var userId = HttpContextExtensions.GetUserId(HttpContext);
        if (userId == null) return Unauthorized("User not found");
        await _segmentService.UpdateAsync(userId.Value, segment, cancellationToken);
        return Ok();
    }

    [HttpDelete]
    [Route(nameof(DeleteSegment))]
    public async Task<ActionResult> DeleteSegment(int id, CancellationToken cancellationToken)
    {
        var userId = HttpContextExtensions.GetUserId(HttpContext);
        if (userId == null) return Unauthorized("User not found");
        await _segmentService.DeleteAsync(userId.Value, id, cancellationToken);
        return Ok();
    }

    [HttpGet]
    [Route(nameof(GetConnectedOptions))]
    public async Task<ActionResult<List<OptionDto>>> GetConnectedOptions(int segmentId, CancellationToken cancellationToken)
    {
        var userId = HttpContextExtensions.GetUserId(HttpContext);
        if (userId == null) return Unauthorized("User not found");
        return await _segmentService.GetConnectedOptionsAsync(userId.Value, segmentId, cancellationToken);
    }
    
    [HttpPut]
    [Route(nameof(UpdateConnectedOptions))]
    public async Task<ActionResult> UpdateConnectedOptions(UpdateConnectedOptionsAm am, CancellationToken cancellationToken)
    {
        var userId = HttpContextExtensions.GetUserId(HttpContext);
        if (userId == null) return Unauthorized("User not found");
        await _segmentService.ConnectSegmentWithOptionsAsync(userId.Value, am, cancellationToken);
        return Ok();
    }

    [HttpGet]
    [Route(nameof(GetSegmentTypes))]
    public async Task<ActionResult<List<SegmentTypeDto>>> GetSegmentTypes(CancellationToken cancellationToken)
    {
        return await _segmentService.GetAllSegmentTypesAsync(cancellationToken);
    }
}