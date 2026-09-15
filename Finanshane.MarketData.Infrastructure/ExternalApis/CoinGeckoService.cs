using Finanshane.MarketData.Application.Interfaces;
using Finanshane.MarketData.Domain.Models;
using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;

namespace Finanshane.MarketData.Infrastructure.ExternalApis
{
    public class CoinGeckoService : ICryptoPriceService
    {
        private readonly HttpClient _httpClient;

        public CoinGeckoService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<CryptoPrice?> GetPriceAsync(string symbol)
        {
            var coinId = symbol.ToLower() switch
            {
                "btc" => "bitcoin",
                "eth" => "ethereum",
                _ => symbol.ToLower()
            };

            var response = await _httpClient.GetAsync($"api/v3/simple/price?ids={coinId}&vs_currencies=usd");
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }
            
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            if (!doc.RootElement.TryGetProperty(coinId, out var coinElement))
            {
                return null;
            }

            var price = coinElement.GetProperty("usd").GetDecimal();
            return new CryptoPrice(symbol.ToUpper(), price);
        }
    }
}
