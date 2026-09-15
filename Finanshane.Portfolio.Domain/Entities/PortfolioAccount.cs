using System;
using System.Collections.Generic;
using System.Text;

namespace Finanshane.Portfolio.Domain.Entities
{
    public class PortfolioAccount
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public decimal CashBalance { get; set; } // ondalık hassasiyeti tam koruması için decimal
        public string Currency { get; set; } = "USD";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
