using Db.Repositories;

namespace Domain.Dtos;

public class UserPreferenceDto
{
    public int PreferredUtcOffset { get; set; }
    public int PreferredCurrencyId { get; set; } = 1;

    public UserPreferenceDto() { }

    public UserPreferenceDto(UserPreference userPreference)
    {
        PreferredUtcOffset = userPreference.preferred_utc_offset;
        PreferredCurrencyId = userPreference.preferred_currency_id;
    }
}
