using Db.Repositories;

namespace Domain.Dtos;

public class UserPreferenceDto
{
    public int PreferredUtcOffset { get; set; }

    public UserPreferenceDto() { }

    public UserPreferenceDto(UserPreference userPreference)
    {
        PreferredUtcOffset = userPreference.preferred_utc_offset;
    }
}