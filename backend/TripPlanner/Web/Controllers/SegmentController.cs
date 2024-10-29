using Application.Services;
using Domain.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace Web.Controllers;

[Route($"api/[controller]")]
[ApiController]
public class SegmentController{
    private readonly SegmentService _segmentService;

    public SegmentController(SegmentService segmentService)
    {
        _segmentService = segmentService;
    }

    [HttpGet]
    [Route(nameof(GetSegmentsByTripId))]
    public async Task<List<SegmentDto>> GetSegmentsByTripId(int tripId, CancellationToken cancellationToken)
    {
        return await _segmentService.GetSegmentsByTripIdAsync(tripId, cancellationToken);
    }

    [HttpGet]
    [Route(nameof(GetSegmentById))]
    public async Task<SegmentDto?> GetSegmentById(int id, CancellationToken cancellationToken)
    {
        return await _segmentService.GetSegmentByIdAsync(id, cancellationToken);
    }

    [HttpPost]
    [Route(nameof(AddSegment))]
    public async Task AddSegment(SegmentDto segment, CancellationToken cancellationToken)
    {
        await _segmentService.AddSegmentAsync(segment, cancellationToken);
    }

    [HttpPut]
    [Route(nameof(UpdateSegment))]
    public async Task UpdateSegment(SegmentDto segment, CancellationToken cancellationToken)
    {
        await _segmentService.UpdateSegmentAsync(segment, cancellationToken);
    }

    [HttpDelete]
    [Route(nameof(DeleteSegment))]
    public async Task DeleteSegment(int id, CancellationToken cancellationToken)
    {
        await _segmentService.DeleteSegmentAsync(id, cancellationToken);
    }
}