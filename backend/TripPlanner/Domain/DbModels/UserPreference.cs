namespace Db.Repositories;

public class UserPreference
{
    public int id { get; set; }
    public int app_user_id { get; set; }
    public int preferred_utc_offset { get; set; }
}