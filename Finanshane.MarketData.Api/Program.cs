using Finanshane.MarketData.Application.Interfaces;
using Finanshane.MarketData.Infrastructure.ExternalApis;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddSwaggerGen();
builder.Services.AddMemoryCache();
builder.Services.AddHttpClient<ICryptoPriceService, CoinGeckoService>(client =>
{
    client.BaseAddress = new Uri("https://api.coingecko.com/");
    client.DefaultRequestHeaders.Add("User-Agent", "Finanshane/1.0");
});

builder.Services.AddHealthChecks();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
