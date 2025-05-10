using Api;
using Api.Models;
using Microsoft.AspNetCore.SignalR;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSignalR(o => {
    o.EnableDetailedErrors = true;
});

const string corsPolicy = "UiCors";
builder.Services.AddCors(options =>
{
    options.AddPolicy(corsPolicy, policy =>
    {
        policy
            .WithOrigins("http://localhost:8080",        // local dev
                "http://ui", "http://ui:80")    // docker-compose
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// — Swagger / OpenAPI —
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin()));

builder.Services.AddSingleton<AuctionService>();

var app = builder.Build();

// Swagger middleware (always on for demo)
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors(corsPolicy);

// REST: initial product list
app.MapGet("/api/products", (AuctionService svc) =>
    svc.Products.Select(p => p.ToDto()));

// REST: place bid
app.MapPost("/api/bid", async (BidRequest bid, AuctionService svc, IHubContext<AuctionHub> hub) =>
{
    var result = svc.TryPlaceBid(bid.ProductId, bid.Amount, bid.Bidder);
    if (!result.Success) return Results.BadRequest(result.Message);

    // push update to every subscribed client
    await hub.Clients.All.SendAsync("ReceiveBid", result.Product.ToDto());
    return Results.Ok(result.Product.ToDto());
});

// SignalR endpoint
app.MapHub<AuctionHub>("/hubs/auction");

// listen on 0.0.0.0:8080 when containerised
app.Urls.Add("http://0.0.0.0:5000");
app.Urls.Add("http://0.0.0.0:8080");

app.Run();