using System;
using System.Collections.Generic;
using System.Text;

namespace Finanshane.MarketData.Domain.Models
{
    public record CryptoPrice(string Symbol, decimal PriceUsd, decimal? Change24h = null);

    public record PricePoint(long TimestampMs, decimal PriceUsd);
}
