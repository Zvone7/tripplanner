namespace Domain.Settings;

public class AppSettings
{
    public string DbConnString { get; set; }
    public string FrontendRootUrl { get; set; }
    public string BackendRootUrl { get; set; }
    public string FrontendRouteTrips { get; set; }
    public string EnvCode { get; set; }
    public string BuildNumber { get; set; }
    public DateTime AppStartedUtc { get; set; }
    public GoogleAuthSettings GoogleAuthSettings { get; set; }
}

public class GoogleAuthSettings
{
    public string ClientId { get; set; }
    public string ClientSecret { get; set; }
}