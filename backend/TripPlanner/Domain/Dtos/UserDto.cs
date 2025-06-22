using Db.Repositories;

namespace Domain.Dtos;

public class UserDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string Role { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public UserPreferenceDto? UserPreference { get; set; }
    public bool IsApproved { get; set; }
}

public class UserPreferenceDto
{
    public int PreferredUtcOffset { get; set; }

    public UserPreferenceDto() { }

    public UserPreferenceDto(UserPreference userPreference)
    {
        PreferredUtcOffset = userPreference.preferred_utc_offset;
    }
}