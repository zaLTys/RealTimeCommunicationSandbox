using Api.Models;

namespace Api;
public class AuctionService
{
    private const decimal MinStep = 1m; 
    private static readonly TimeSpan BidWindow = TimeSpan.FromSeconds(300);

    public List<Product> Products { get; } = new();

    public AuctionService()
    {
        var now = DateTime.UtcNow;
        Products.AddRange(new[]
        {
            new Product("Vintage Clock",          10m, now.AddMinutes(1)),
            new Product("Retro Telephone",        20m, now.AddMinutes(1)),
            new Product("Old Film Camera",        30m, now.AddMinutes(1)),
            new Product("Antique Radio",          40m, now.AddMinutes(1)),
            new Product("Classic Typewriter",     50m, now.AddMinutes(1)),
            new Product("Pocket Watch",           60m, now.AddMinutes(1))
        });
    }

    public (bool Success, string? Message, Product Product) TryPlaceBid(Guid id, decimal amount, string bidder)
    {
        var p = Products.FirstOrDefault(x => x.Id == id);
        if (p == null)           return (false, "Product not found", null!);
        if (DateTime.UtcNow >= p.EndsAt)
            return (false, "Auction already ended", p);
        if (amount < p.CurrentBid + MinStep)
            return (false, $"Bid must be at least ${MinStep} higher", p);

        // accept bid
        p.CurrentBid = amount;
        p.LastBidder = bidder;

        // extend if inside last 30‑second window
        if (p.EndsAt - DateTime.UtcNow <= BidWindow)
            p.EndsAt = p.EndsAt.Add(BidWindow);

        return (true, null, p);
    }
}