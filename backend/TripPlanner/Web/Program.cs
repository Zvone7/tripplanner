using Application.Services;
using Db.Repositories;
using Domain.Settings;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.CookiePolicy;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile("appsettings.json", optional: false);
builder.Configuration.AddJsonFile("appsettings.Development.json", optional: true);
var appSettings = new AppSettings();
builder.Configuration.GetSection("AppSettings").Bind(appSettings);

builder.Services.AddSingleton(appSettings);
builder.Services.AddScoped<TripRepository>();
builder.Services.AddScoped<OptionRepository>();
builder.Services.AddScoped<SegmentRepository>();
builder.Services.AddScoped<UserRepository>();
builder.Services.Configure<AntiforgeryOptions>(config =>
{
    // config.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    config.Cookie.SecurePolicy = CookieSecurePolicy.None;
});

builder.Services.AddScoped<TripService>();
builder.Services.AddScoped<OptionService>();
builder.Services.AddScoped<SegmentService>();
builder.Services.AddScoped<UserService>();

builder.Services.Configure<CookiePolicyOptions>(options =>
{
    options.MinimumSameSitePolicy = SameSiteMode.Lax;
    options.Secure = CookieSecurePolicy.Always;
#if DEBUG
    options.Secure = CookieSecurePolicy.None;
    options.HttpOnly = HttpOnlyPolicy.Always;
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
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;// Use only with HTTPS
#if DEBUG
        options.Cookie.HttpOnly = true;
        options.Cookie.SecurePolicy = CookieSecurePolicy.None;
#else
#endif
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
app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();