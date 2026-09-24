using System;
using System.Collections.Generic;
using System.Text;

namespace Finanshane.Portfolio.Application.Interfaces
{
    public interface IMarketDataClient
    {
        Task<decimal?> GetPriceAsync(string symbol);
    }
}
