namespace Api.Models;

public class Product
{
    public Guid Id { get; } = Guid.NewGuid();
    public string Name { get; }
    public decimal CurrentBid { get; set; }
    public DateTime EndsAt { get; set; }
    public string? LastBidder { get; set; }

    public Product(string name, decimal startBid, DateTime endsAt)
    {
        Name       = name;
        CurrentBid = startBid;
        EndsAt     = endsAt;
    }

    public ProductDto ToDto() => new()
    {
        Id         = Id,
        Name       = Name,
        CurrentBid = CurrentBid,
        EndsAt     = EndsAt,
        LastBidder = LastBidder ?? string.Empty
    };
}

