using Application.Services;
using Azure.Identity;
using Db.Repositories;
using Domain.Settings;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.HttpOverrides;
using Web.Helpers;

public class Program
{
    public static void Main(string[] args)
    {
        Console.WriteLine("****************************************");
        Console.WriteLine("****************************************");
        Console.WriteLine($"{DateTime.UtcNow}|App start");
        Console.WriteLine("****************************************");
        Console.WriteLine("****************************************");

        var builder = WebApplication.CreateBuilder(args);
        var appSettings = SetupConfiguration(builder);
        InitializeDi(builder, appSettings);
        SetupAuthNAuth(builder, appSettings);

        var app = builder.Build();
        ConfigureApp(app);

        Console.WriteLine("****************************************");
        Console.WriteLine("****************************************");
        Console.WriteLine($"{DateTime.UtcNow}|Final app start");
        Console.WriteLine("****************************************");
        Console.WriteLine("****************************************");
        app.Run();
    }

    private static AppSettings SetupConfiguration(WebApplicationBuilder builder)
    {
        builder.Configuration.AddEnvironmentVariables();
        builder.Configuration.AddJsonFile("appsettings.json", optional: false);
        Console.WriteLine($"{DateTime.UtcNow}|appsettings loaded");
        LoadKeyVault(builder);
#if DEBUG
        builder.Configuration.AddJsonFile("appsettings.Development.json", optional: true);
        Console.WriteLine($"{DateTime.UtcNow}|appsettings.dev loaded");
#endif
        var appSettings = InitializeAppSettings(builder);

#if DEBUG
        // use this if https is not working
        // builder.WebHost.UseUrls("http://0.0.0.0:5156");
        builder.WebHost.UseUrls("https://0.0.0.0:7048");
#endif
        return appSettings;
    }

    private static AppSettings InitializeAppSettings(WebApplicationBuilder builder)
    {
        var appSettings = new AppSettings();
        builder.Configuration.GetSection("AppSettings").Bind(appSettings);
        appSettings.FrontendRootUrl = builder.Configuration["FRONTEND_ROOT_URL"];
        appSettings.BackendRootUrl = builder.Configuration["BACKEND_ROOT_URL"];
        appSettings.AppStartedUtc = DateTime.UtcNow;
        appSettings.EnvCode = builder.Configuration["ENV_CODE"];
        appSettings.BuildNumber = builder.Configuration["BUILD_NUMBER"];
        Console.WriteLine($"{DateTime.UtcNow}|env: {appSettings.EnvCode}, buildNumber: {appSettings.BuildNumber}");
        Console.WriteLine($"{DateTime.UtcNow}|Using frontendRootUrl: {appSettings.FrontendRootUrl}");
        Console.WriteLine($"{DateTime.UtcNow}|Using backendRootUrl: {appSettings.BackendRootUrl}");
        builder.Services.AddSingleton(appSettings);
        Console.WriteLine($"{DateTime.UtcNow}|AppSettings singleton created");
        return appSettings;
    }

    private static void LoadKeyVault(WebApplicationBuilder builder)
    {
        var keyVaultName = builder.Configuration["KEYVAULT_NAME"];
        var keyvaultUri = new Uri($"https://{keyVaultName}.vault.azure.net/");
#if DEBUG
        var tenantId = builder.Configuration["TENANT_ID"];
        var clientId = builder.Configuration["CLIENT_ID"];
        var clientSecret = builder.Configuration["CLIENT_SECRET"];
        var clientSecretCredential = new ClientSecretCredential(tenantId, clientId, clientSecret);
#else
        var clientSecretCredential = new DefaultAzureCredential();
#endif

        Console.WriteLine($"{DateTime.UtcNow}|Using keyvault {keyVaultName}");
        builder.Configuration.AddAzureKeyVault(keyvaultUri, clientSecretCredential);
        Console.WriteLine($"{DateTime.UtcNow}|Keyvault loaded");
    }

    private static void InitializeDi(WebApplicationBuilder builder, AppSettings appSettings)
    {
        SetupServices(builder);
        SetupRepositories(builder);
    }

    private static void SetupServices(WebApplicationBuilder builder)
    {
        builder.Services.AddScoped<TripService>();
        builder.Services.AddScoped<OptionService>();
        builder.Services.AddScoped<SegmentService>();
        builder.Services.AddScoped<UserService>();
        builder.Services.AddScoped<TripAccessFilterAttribute>();
    }

    private static void SetupRepositories(WebApplicationBuilder builder)
    {
        builder.Services.AddScoped<TripRepository>();
        builder.Services.AddScoped<OptionRepository>();
        builder.Services.AddScoped<SegmentRepository>();
        builder.Services.AddScoped<UserRepository>();
    }

    private static void SetupAuthNAuth(WebApplicationBuilder builder, AppSettings appSettings)
    {
        builder.Services.Configure<AntiforgeryOptions>(config =>
        {
            config.Cookie.SecurePolicy = CookieSecurePolicy.Always;
#if DEBUG
            config.Cookie.SameSite = SameSiteMode.Lax;
#else
            config.Cookie.SameSite = SameSiteMode.None;
#endif
        });

        builder.Services.Configure<CookiePolicyOptions>(options =>
        {
            options.Secure = CookieSecurePolicy.Always;
#if DEBUG
            options.MinimumSameSitePolicy = SameSiteMode.Lax;
#else
            options.MinimumSameSitePolicy = SameSiteMode.None;
#endif
        });

        builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
            .AddCookie(options =>
            {
                options.LoginPath = "/";
                options.LogoutPath = "/api/Account/Logout";
                options.ExpireTimeSpan = TimeSpan.FromDays(7);
                options.SlidingExpiration = true;
                options.CookieManager = new ChunkingCookieManager();
                options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                options.Cookie.Name = "TpAuthCookie";
#if DEBUG
                options.Cookie.SameSite = SameSiteMode.Lax;
#else
                options.Cookie.Domain = ".northeurope-01.azurewebsites.net";
                options.Cookie.SameSite = SameSiteMode.None;
#endif
            })
            .AddGoogle(options =>
            {
                options.ClientId = appSettings.GoogleAuthSettings.ClientId;
                options.ClientSecret = appSettings.GoogleAuthSettings.ClientSecret;
                options.CallbackPath = "/signin-google";
                options.ReturnUrlParameter = "returnUrl";
                options.AuthorizationEndpoint = "https://accounts.google.com/o/oauth2/v2/auth";
                options.TokenEndpoint = "https://oauth2.googleapis.com/token";
            });

        builder.Services.AddControllersWithViews();

        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowFrontend",
                builder => builder
                    .WithOrigins(
#if DEBUG
                        "http://localhost:3000",
                        "https://localhost:7048",
                        "http://localhost:5156",
#endif
                        appSettings.FrontendRootUrl,
                        appSettings.BackendRootUrl)
                    .AllowCredentials()
                    .AllowAnyMethod()
                    .AllowAnyHeader()
            );
        });
    }

    private static void ConfigureApp(WebApplication app)
    {
        // Configure the HTTP request pipeline.
        if (!app.Environment.IsDevelopment())
        {
            app.UseExceptionHandler("/Home/Error");
            // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
            app.UseHsts();
        }

        app.UseForwardedHeaders(new ForwardedHeadersOptions
        {
            ForwardedHeaders = ForwardedHeaders.XForwardedProto
        });

        app.UseCors("AllowFrontend");

        app.UseHttpsRedirection();

        app.UseDefaultFiles();
        app.UseStaticFiles();// Serves Next.js build files
        app.MapFallbackToFile("index.html");// Fallback for SPA routes

        app.UseRouting();

        app.UseAuthentication();
        app.UseAuthorization();

        app.MapControllerRoute(
            name: "default",
            pattern: "{controller=Home}/{action=Index}/{id?}");
    }
}