using Application.Services;
using Domain.Dtos;
using Domain.Helpers;
using Microsoft.AspNetCore.Mvc;

[Route($"api/[controller]")]
[ApiController]
public class UserController(UserService userService) : Controller
{
    private readonly UserService _userService = userService;

    [HttpGet("PendingApprovals")]
    public async Task<ActionResult<List<UserDto>>> PendingApprovals(CancellationToken cancellationToken)
    {
        if (User.Identity?.IsAuthenticated == true)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type.ToString() == "UserId");
            var userId = int.Parse(userIdClaim.Value);
            var user = await _userService.GetAsync(userId: userId, cancellationToken);
            if (user != null && user.IsApproved && user.IsAdmin())
            {
                var res = await _userService.GetUnapprovedUsersAsync(cancellationToken);
                return res;
            }
        }
        return BadRequest();
    }
    
    [HttpPost("ApproveUser")]
    public async Task<ActionResult<bool>> ApproveUser(int userIdToApprove, CancellationToken cancellationToken)
    {
        if (User.Identity?.IsAuthenticated == true)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type.ToString() == "UserId");
            var userId = int.Parse(userIdClaim.Value);
            var user = await _userService.GetAsync(userId: userId, cancellationToken);
            if (user != null && user.IsApproved && user.IsAdmin())
            {
                var res = await _userService.SetApprovedAsync(userIdToApprove, cancellationToken);
                return res;
            }
        }
        return BadRequest();
    }
}