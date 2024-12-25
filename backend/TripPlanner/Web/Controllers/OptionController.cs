using Application.Services;
using Domain.ActionModels;
using Domain.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Web.Controllers;

[Route($"api/[controller]")]
[Authorize]
[ApiController]
public class OptionController : ControllerBase
{
    private readonly OptionService _optionService;

    public OptionController(OptionService optionService)
    {
        _optionService = optionService;
    }

    [HttpGet]
    [Route(nameof(GetOptionsByTripId))]
    public async Task<ActionResult<List<OptionDto>>> GetOptionsByTripId(int tripId, CancellationToken cancellationToken)
    {
        var userId = HttpContextExtensions.GetUserId(HttpContext);
        if (userId == null) return Unauthorized("User not found");
        var options = await _optionService.GetAllByTripIdAsync(userId.Value, tripId, cancellationToken);
        return Ok(options);
    }

    [HttpGet]
    [Route(nameof(GetOptionById))]
    public async Task<ActionResult<OptionDto?>> GetOptionById(int id, CancellationToken cancellationToken)
    {
        var userId = HttpContextExtensions.GetUserId(HttpContext);
        if (userId == null) return Unauthorized("User not found");
        var option = await _optionService.GetAsync(userId.Value, id, cancellationToken);
        return Ok(option);
    }

    [HttpPost]
    [Route(nameof(CreateOption))]
    public async Task<ActionResult> CreateOption(OptionDto option, CancellationToken cancellationToken)
    {
        var userId = HttpContextExtensions.GetUserId(HttpContext);
        if (userId == null) return Unauthorized("User not found");
        await _optionService.CreateAsync(userId.Value, option, cancellationToken);
        return Ok();
    }

    [HttpPut]
    [Route(nameof(UpdateOption))]
    public async Task<ActionResult> UpdateOption(UpdateOptionAm option, CancellationToken cancellationToken)
    {
        var userId = HttpContextExtensions.GetUserId(HttpContext);
        if (userId == null) return Unauthorized("User not found");
        await _optionService.UpdateAsync(userId.Value, option, cancellationToken);
        return Ok();
    }

    [HttpDelete]
    [Route(nameof(DeleteOption))]
    public async Task<ActionResult> DeleteOption(int id, CancellationToken cancellationToken)
    {
        var userId = HttpContextExtensions.GetUserId(HttpContext);
        if (userId == null) return Unauthorized("User not found");
        await _optionService.DeleteAsync(userId.Value, id, cancellationToken);
        return Ok();
    }

    [HttpGet]
    [Route(nameof(GetConnectedSegments))]
    public async Task<ActionResult<List<SegmentDto>>> GetConnectedSegments(int optionId, CancellationToken cancellationToken)
    {
        var userId = HttpContextExtensions.GetUserId(HttpContext);
        if (userId == null) return Unauthorized("User not found");
        var segments = await _optionService.GetConnectedSegmentsAsync(userId.Value, optionId, cancellationToken);
        return Ok(segments);
    }

    [HttpPut]
    [Route(nameof(UpdateConnectedSegments))]
    public async Task<ActionResult> UpdateConnectedSegments(UpdateConnectedSegmentsAm am, CancellationToken cancellationToken)
    {
        var userId = HttpContextExtensions.GetUserId(HttpContext);
        if (userId == null) return Unauthorized("User not found");
        await _optionService.ConnectOptionWithSegmentsAsync(userId.Value, am, cancellationToken);
        return Ok();
    }
}