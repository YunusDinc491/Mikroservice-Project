using Finanshane.MarketData.Domain.Models;
using System;
using System.Collections.Generic;
using System.Text;

namespace Finanshane.MarketData.Application.Interfaces
{
    public interface ICryptoPriceService
    {
        Task<CryptoPrice?> GetPriceAsync(string symbol);
    }
}
