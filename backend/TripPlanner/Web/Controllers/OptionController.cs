using Application.Services;
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
        return await _optionService.GetOptionsByTripIdAsync(tripId, cancellationToken);
    }

    [HttpGet]
    [Route(nameof(GetOptionById))]
    public async Task<OptionDto?> GetOptionById(int id, CancellationToken cancellationToken)
    {
        return await _optionService.GetOptionByIdAsync(id, cancellationToken);
    }

    [HttpPost]
    [Route(nameof(AddOption))]
    public async Task AddOption(OptionDto option, CancellationToken cancellationToken)
    {
        await _optionService.AddOptionAsync(option, cancellationToken);
    }

    [HttpPut]
    [Route(nameof(UpdateOption))]
    public async Task UpdateOption(OptionDto option, CancellationToken cancellationToken)
    {
        await _optionService.UpdateOptionAsync(option, cancellationToken);
    }

    [HttpDelete]
    [Route(nameof(DeleteOption))]
    public async Task DeleteOption(int id, CancellationToken cancellationToken)
    {
        await _optionService.DeleteOptionAsync(id, cancellationToken);
    }
}