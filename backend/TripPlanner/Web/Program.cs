using Application.Services;
using Db.Repositories;
using Domain.Settings;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication.Cookies;
using Web.Helpers;
#if !DEBUG
using Azure.Identity;
#endif

Console.WriteLine($"{DateTime.UtcNow}|AppStarted");
var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddEnvironmentVariables();
builder.Configuration.AddJsonFile("appsettings.json", optional: false);
Console.WriteLine($"{DateTime.UtcNow}|appsettings loaded");
#if DEBUG
builder.Configuration.AddJsonFile("appsettings.Development.json", optional: true);
Console.WriteLine($"{DateTime.UtcNow}|appsettings.dev loaded");
#else
var keyVaultName = builder.Configuration["KeyVaultName"];
var keyvaultUri = new Uri($"https://{keyVaultName}.vault.azure.net/");
Console.WriteLine($"{DateTime.UtcNow}|Using keyvault {keyVaultName}");
builder.Configuration.AddAzureKeyVault(keyvaultUri, new DefaultAzureCredential());
Console.WriteLine($"{DateTime.UtcNow}|Keyvault loaded");
#endif
var appSettings = new AppSettings();
builder.Configuration.GetSection("AppSettings").Bind(appSettings);

builder.Services.AddSingleton(appSettings);
Console.WriteLine($"{DateTime.UtcNow}|DI Started");
builder.Services.AddScoped<TripRepository>();
builder.Services.AddScoped<OptionRepository>();
builder.Services.AddScoped<SegmentRepository>();
builder.Services.AddScoped<UserRepository>();
builder.Services.Configure<AntiforgeryOptions>(config =>
{
    config.Cookie.SecurePolicy = CookieSecurePolicy.Always;
});

builder.Services.AddScoped<TripService>();
builder.Services.AddScoped<OptionService>();
builder.Services.AddScoped<SegmentService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<TripAccessFilterAttribute>();

builder.Services.Configure<CookiePolicyOptions>(options =>
{
    options.MinimumSameSitePolicy = SameSiteMode.Lax;
    options.Secure = CookieSecurePolicy.Always;
});
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/";
        options.LogoutPath = "/api/Account/Logout";
        options.ExpireTimeSpan = TimeSpan.FromDays(7);
        options.SlidingExpiration = true;
        options.CookieManager = new ChunkingCookieManager();
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    })
    .AddGoogle(options =>
    {
        options.ClientId = appSettings.GoogleAuthSettings.ClientId;
        options.ClientSecret = appSettings.GoogleAuthSettings.ClientSecret;
        options.CallbackPath = "/signin-google";
    });

builder.Services.AddControllersWithViews();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        builder => builder
            .WithOrigins("http://localhost:3000", "https://localhost:7048", "http://localhost:5156")
            .AllowCredentials()
            .AllowAnyMethod()
            .AllowAnyHeader()
    );
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}
app.UseCors("AllowFrontend");

#if !DEBUG
app.UseHttpsRedirection();
#endif

app.UseDefaultFiles();
app.UseStaticFiles(); // Serves Next.js build files
app.MapFallbackToFile("index.html"); // Fallback for SPA routes


app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

Console.WriteLine($"{DateTime.UtcNow}|Final app start");
app.Run();