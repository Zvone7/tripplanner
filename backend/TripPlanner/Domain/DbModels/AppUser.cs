namespace Db.Repositories;

public class AppUser{
    public int Id { get; set; }
    public string name { get; set; }
    public string email { get; set; }
    public string role { get; set; }
    public DateTime created_at_utc { get; set; }
    public DateTime? approved_at_utc { get; set; }
    public bool is_approved { get; set; }
}
public class UserPreference
{
    public int id { get; set; }
    public int app_user_id { get; set; }
    public int preferred_utc_offset { get; set; }
}