using Application.Services;
using Domain.Settings;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile("appsettings.json", optional: false);
builder.Configuration.AddJsonFile("appsettings.Development.json", optional: true);
var appSettings = new AppSettings();
builder.Configuration.GetSection("AppSettings").Bind(appSettings);

builder.Services.AddSingleton(appSettings);
builder.Services.AddScoped<TripRepository>();
builder.Services.AddScoped<OptionRepository>();
builder.Services.AddScoped<SegmentRepository>();

builder.Services.AddScoped<TripService>();
builder.Services.AddScoped<OptionService>();
builder.Services.AddScoped<SegmentService>();

builder.Services.AddControllersWithViews();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        builder => builder
            .WithOrigins("http://localhost:3000")
            .AllowAnyMethod()
            .AllowAnyHeader());
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

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();