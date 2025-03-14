using Db.Repositories;
using Domain.Constants;
using Domain.Dtos;

namespace Application.Services;

public class UserService
{
    private readonly UserRepository _userRepository_;

    public UserService(UserRepository userRepository)
    {
        _userRepository_ = userRepository;
    }

    public async Task<UserDto> CreateUserAsync(string email, string name, CancellationToken cancellationToken)
    {
        var created = await _userRepository_.CreateAsync(new AppUser
        {
            name = name,
            email = email,
            role = UserRoles.user.ToString(),
            created_at_utc = DateTime.UtcNow
        }, cancellationToken);

        var result = new UserDto
        {
            Id = created.Id,
            Name = created.name,
            Email = created.email,
            Role = created.role
        };

        return result;
    }

    public async Task<UserDto?> GetAsync(int userId, CancellationToken cancellationToken)
    {
        var user = await _userRepository_.GetAsync(userId, cancellationToken);
        var result = user == null ? null : new UserDto
        {
            Id = user.Id,
            Name = user.name,
            Email = user.email,
            Role = user.role,
            CreatedAt = user.created_at_utc,
            ApprovedAt = user.approved_at_utc,
            IsApproved = user.is_approved,
        };
        return result;
    }

    public async Task<UserDto?> GetAsync(string email, CancellationToken cancellationToken)
    {
        var user = await _userRepository_.GetAsync(email, cancellationToken);
        var result = user == null ? null : new UserDto
        {
            Id = user.Id,
            Name = user.name,
            Email = user.email,
            Role = user.role,
            CreatedAt = user.created_at_utc,
            ApprovedAt = user.approved_at_utc,
            IsApproved = user.is_approved,
        };
        return result;
    }

    public async Task<List<UserDto>> GetUnapprovedUsersAsync(CancellationToken cancellationToken)
    {
        var users = await _userRepository_.GetUnapprovedUsersAsync(cancellationToken);
        var result = users.Select(user => new UserDto
        {
            Id = user.Id,
            Name = user.name,
            Email = user.email,
            Role = user.role,
            CreatedAt = user.created_at_utc,
            ApprovedAt = user.approved_at_utc,
            IsApproved = user.is_approved,
        }).ToList();
        return result;
    }

    public async Task<bool> SetApprovedAsync(int userId, CancellationToken cancellationToken)
    {
        var userToApprove = await GetAsync(userId, cancellationToken);
        if (userToApprove != null)
        {
            await _userRepository_.SetApprovedAsync(userId, cancellationToken);
            return true;
        }
        return false;
    }
}