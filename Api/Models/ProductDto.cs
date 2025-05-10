namespace Api.Models;

public class ProductDto
{
    public Guid     Id         { get; set; }
    public string   Name       { get; set; } = string.Empty;
    public decimal  CurrentBid { get; set; }
    public DateTime EndsAt     { get; set; }
    public string   LastBidder { get; set; } = string.Empty;
}