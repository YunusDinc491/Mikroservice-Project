using System;
using System.Collections.Generic;
using System.Text;

namespace Finanshane.Portfolio.Domain.Entities
{
    public class Holding
    {
        public Guid Id { get; set; }
        public Guid PortfolioId { get; set; }
        public string Symbol { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
    }
}