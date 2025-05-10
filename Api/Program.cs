using Api;
using Api.Models;
using Microsoft.AspNetCore.SignalR;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSignalR();
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin()));

builder.Services.AddSingleton<AuctionService>();

var app = builder.Build();
app.UseCors();

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
app.Urls.Add("http://0.0.0.0:8080");

app.Run();