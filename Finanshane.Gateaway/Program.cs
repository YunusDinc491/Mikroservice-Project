using Microsoft.AspNetCore.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

builder.Services.AddRateLimiter(options =>
{


    options.AddFixedWindowLimiter("fixed", opt =>

    {
        opt.PermitLimit = 100;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueLimit = 0;
    });
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    });

builder.Services.AddHealthChecks();

var app = builder.Build();
app.UseRateLimiter();
app.MapReverseProxy().RequireRateLimiting("fixed");
app.MapHealthChecks("/health");

app.Run();