using Finanshane.Portfolio.Application.Interfaces;
using System;
using System.Collections.Generic;
using System.Net.Http.Json;
using System.Text;

namespace Finanshane.Portfolio.Infrastructure.ExternalServices
{
    public class MarketDataClient : IMarketDataClient
    {
        private readonly HttpClient _httpClient;

        public MarketDataClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<decimal?> GetPriceAsync(string symbol)
        {
            var response = await _httpClient.GetAsync($"api/MarketData/crypto/{symbol}");
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            var price = await response.Content.ReadFromJsonAsync<CryptoPriceResponse>();
            return price?.PriceUsd;
        }
    }

    public record CryptoPriceResponse(string Symbol, decimal PriceUsd);
}
