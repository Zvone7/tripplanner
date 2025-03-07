namespace Domain.Settings;

public class AppSettings
{
    public string DbConnString { get; set; }
    public string FrontendRootUrl { get; set; }
    public string FrontendRouteTrips { get; set; }
    public GoogleAuthSettings GoogleAuthSettings { get; set; }
}

public class GoogleAuthSettings
{
    public string ClientId { get; set; }
    public string ClientSecret { get; set; }
}