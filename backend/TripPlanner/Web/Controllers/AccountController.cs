using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Application.Services;
using Domain.Dtos;
using Domain.Settings;
using Microsoft.AspNetCore.Authentication.Google;

[Route($"api/[controller]")]
[ApiController]
public class AccountController : Controller
{
    private readonly AppSettings _appSettings_;
    private readonly UserService _userService_;
    private readonly string _redirectUrl_;

    public AccountController(
        AppSettings appSettings,
        UserService userService)
    {
        _appSettings_ = appSettings;
        _userService_ = userService;
        _redirectUrl_ = $"{_appSettings_.FrontendRootUrl.TrimEnd('/')}/{_appSettings_.FrontendRouteTrips.TrimStart('/')}";
    }

    [HttpGet("Login")]
    public IActionResult Login()
    {
        // var redirectUrl = Url.Action(nameof(GoogleResponse), "Account", Request.Scheme);
        var redirectUrl = string.IsNullOrWhiteSpace(_appSettings_.FrontendRootUrl) ?
            $"{_appSettings_.BackendRootUrl}api/account/googleresponse" :
            $"{_appSettings_.FrontendRootUrl}api/account/googleresponse";
        Console.WriteLine($"Will redirect google login to {redirectUrl}");

        var properties = new AuthenticationProperties { RedirectUri = redirectUrl };
        properties.AllowRefresh = true;
        properties.IsPersistent = true;
        return Challenge(properties, GoogleDefaults.AuthenticationScheme);
    }

    [HttpGet("GoogleResponse")]
    public async Task<IActionResult> GoogleResponse(CancellationToken cancellationToken = default)
    {
        Console.WriteLine($"Received google response!");
        var authenticateResult = await HttpContext.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);

        if (!authenticateResult.Succeeded)
        {
            Console.WriteLine($"Unsucesful auth tho.");
            return Redirect(_redirectUrl_);
        }
        Console.WriteLine($"Successfull auth.");

        // Extract user information from claims
        var claims = authenticateResult.Principal.Identities
            .FirstOrDefault()?.Claims.Select(claim => new
            {
                claim.Type,
                claim.Value
            });

        var email = claims?.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
        var name = claims?.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value;

        if (!string.IsNullOrEmpty(email))
        {
            var userFromBefore = await _userService_.GetAsync(email, cancellationToken);
            if (userFromBefore == null)
            {
                userFromBefore = await _userService_.CreateUserAsync(email, name, cancellationToken);
            }

            await CreateCookieAsync(userFromBefore.Id, email, name);
            return Redirect(_redirectUrl_);

        }
        return Redirect(_appSettings_.FrontendRootUrl);
    }

    [HttpGet("Info")]
    public async Task<ActionResult<UserDto?>> Info(CancellationToken cancellationToken)
    {
        if (User.Identity?.IsAuthenticated == true)
        {
            var emailClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email);
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type.ToString() == "UserId");
            if (emailClaim != null && userIdClaim != null)
            {
                var user = await _userService_.GetAsync(int.Parse(userIdClaim.Value), cancellationToken);
                return user;
            }
        }
        return Unauthorized();
    }

    private async Task CreateCookieAsync(int userId, string email, string name)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Email, email),
            new Claim(ClaimTypes.Name, name),
            new Claim(ClaimTypes.Role, "User"),
            new Claim("UserId", userId.ToString())
        };

        var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var claimsPrincipal = new ClaimsPrincipal(claimsIdentity);

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            claimsPrincipal,
            new AuthenticationProperties
            {
                IsPersistent = true,
                ExpiresUtc = DateTime.UtcNow.AddDays(7)
            });
    }
}