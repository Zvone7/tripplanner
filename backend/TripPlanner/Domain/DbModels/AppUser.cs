namespace Db.Repositories;

public class AppUser{
    public int Id { get; set; }
    public string name { get; set; }
    public string email { get; set; }
    public string role { get; set; }
    public DateTime created_at_utc { get; set; }
}