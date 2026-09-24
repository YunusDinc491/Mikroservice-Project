using System;

namespace Finanshane.Portfolio.Domain.Entities
{
    public enum TransactionType
    {
        Buy = 0,
        Sell = 1
    }

    public class Transaction
    {
        public Guid Id { get; set; }
        public Guid PortfolioId { get; set; }
        public TransactionType Type { get; set; }
        public string Symbol { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal PricePerUnit { get; set; }
        public decimal TotalUsd { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
