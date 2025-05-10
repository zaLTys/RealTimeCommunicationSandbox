namespace Api.Models;

public record BidRequest(Guid ProductId, decimal Amount, string Bidder);