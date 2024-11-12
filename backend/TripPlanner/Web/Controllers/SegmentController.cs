using Application.Services;
using Domain.ActionModels;
using Domain.DbModels;
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
        return await _segmentService.GetAllByTripIdAsync(tripId, cancellationToken);
    }

    [HttpGet]
    [Route(nameof(GetSegmentById))]
    public async Task<SegmentDto?> GetSegmentById(int id, CancellationToken cancellationToken)
    {
        return await _segmentService.GetAsync(id, cancellationToken);
    }

    [HttpPost]
    [Route(nameof(CreateSegment))]
    public async Task CreateSegment(SegmentDto segment, CancellationToken cancellationToken)
    {
        await _segmentService.CreateAsync(segment, cancellationToken);
    }

    [HttpPut]
    [Route(nameof(UpdateSegment))]
    public async Task UpdateSegment(SegmentDto segment, CancellationToken cancellationToken)
    {
        await _segmentService.UpdateAsync(segment, cancellationToken);
    }

    [HttpDelete]
    [Route(nameof(DeleteSegment))]
    public async Task DeleteSegment(int id, CancellationToken cancellationToken)
    {
        await _segmentService.DeleteAsync(id, cancellationToken);
    }

    [HttpGet]
    [Route(nameof(GetConnectedOptions))]
    public async Task<List<OptionDto>> GetConnectedOptions(int segmentId, CancellationToken cancellationToken)
    {
        return await _segmentService.GetConnectedOptionsAsync(segmentId, cancellationToken);
    }
    
    [HttpPut]
    [Route(nameof(UpdateConnectedOptions))]
    public async Task UpdateConnectedOptions(UpdateConnectedOptionsAm am, CancellationToken cancellationToken)
    {
        await _segmentService.ConnectSegmentWithOptionsAsync(am, cancellationToken);
    }

    [HttpGet]
    [Route(nameof(GetSegmentTypes))]
    public async Task<List<SegmentTypeDto>> GetSegmentTypes(CancellationToken cancellationToken)
    {
        return await _segmentService.GetAllSegmentTypesAsync(cancellationToken);
    }
}