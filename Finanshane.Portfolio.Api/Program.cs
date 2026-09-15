using Finanshane.Portfolio.Application.Consumer;
using Finanshane.Portfolio.Application.Interfaces;
using Finanshane.Portfolio.Application.Queries;
using Finanshane.Portfolio.Infrastructure.Persistence;
using MassTransit;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<PortfolioDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("PortfolioDb")));

builder.Services.AddScoped<IPortfolioRepository, PortfolioRepository>();

builder.Services.AddMediatR(cfg =>
cfg.RegisterServicesFromAssembly(typeof(GetPortfolioQuery).Assembly)
);

builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<UserRegisteredEventConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host("localhost", "/", h =>
        {
            h.Username("admin");
            h.Password("admin123");
        });

        cfg.ConfigureEndpoints(context);
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.MapControllers();

app.Run();