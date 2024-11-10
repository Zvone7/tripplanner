using Application.Services;
using Domain.ActionModels;
using Domain.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace Web.Controllers;

[Route($"api/[controller]")]
[ApiController]
public class OptionController{
    private readonly OptionService _optionService;

    public OptionController(OptionService optionService)
    {
        _optionService = optionService;
    }

    [HttpGet]
    [Route(nameof(GetOptionsByTripId))]
    public async Task<List<OptionDto>> GetOptionsByTripId(int tripId, CancellationToken cancellationToken)
    {
        return await _optionService.GetAllByTripIdAsync(tripId, cancellationToken);
    }

    [HttpGet]
    [Route(nameof(GetOptionById))]
    public async Task<OptionDto?> GetOptionById(int id, CancellationToken cancellationToken)
    {
        return await _optionService.GetAsync(id, cancellationToken);
    }

    [HttpPost]
    [Route(nameof(CreateOption))]
    public async Task CreateOption(OptionDto option, CancellationToken cancellationToken)
    {
        await _optionService.CreateAsync(option, cancellationToken);
    }

    [HttpPut]
    [Route(nameof(UpdateOption))]
    public async Task UpdateOption(UpdateOptionAm option, CancellationToken cancellationToken)
    {
        await _optionService.UpdateAsync(option, cancellationToken);
    }

    [HttpDelete]
    [Route(nameof(DeleteOption))]
    public async Task DeleteOption(int id, CancellationToken cancellationToken)
    {
        await _optionService.DeleteAsync(id, cancellationToken);
    }

    [HttpGet]
    [Route(nameof(GetConnectedSegments))]
    public async Task<List<SegmentDto>> GetConnectedSegments(int optionId, CancellationToken cancellationToken)
    {
        var resp = await _optionService.GetConnectedSegmentsAsync(optionId, cancellationToken);
        return resp;
    }
    [HttpPut]
    [Route(nameof(UpdateConnectedSegments))]
    public async Task UpdateConnectedSegments(UpdateConnectedSegmentsAm am, CancellationToken cancellationToken)
    {
        await _optionService.ConnectOptionWithSegmentsAsync(am, cancellationToken);
    }
}