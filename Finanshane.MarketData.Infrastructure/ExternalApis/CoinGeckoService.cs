using Finanshane.MarketData.Application.Interfaces;
using Finanshane.MarketData.Domain.Models;
using Microsoft.Extensions.Caching.Memory;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;

namespace Finanshane.MarketData.Infrastructure.ExternalApis
{
    public class CoinGeckoService : ICryptoPriceService
    {
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache;

        private static readonly TimeSpan PriceCacheTtl = TimeSpan.FromSeconds(30);
        private static readonly TimeSpan HistoryCacheTtl = TimeSpan.FromMinutes(2);

        public CoinGeckoService(HttpClient httpClient, IMemoryCache cache)
        {
            _httpClient = httpClient;
            _cache = cache;
        }

        public static readonly IReadOnlyDictionary<string, string> SymbolToCoinId = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["btc"] = "bitcoin",
            ["eth"] = "ethereum",
            ["usdt"] = "tether",
            ["usdc"] = "usd-coin",
            ["bnb"] = "binancecoin",
            ["sol"] = "solana",
            ["xrp"] = "ripple",
            ["ada"] = "cardano",
            ["doge"] = "dogecoin",
            ["ton"] = "the-open-network",
            ["dot"] = "polkadot",
            ["matic"] = "matic-network",
            ["ltc"] = "litecoin",
            ["avax"] = "avalanche-2",
            ["trx"] = "tron",
            ["link"] = "chainlink",
        };

        private static string ToCoinId(string symbol) =>
            SymbolToCoinId.TryGetValue(symbol, out var coinId) ? coinId : symbol.ToLower();

        public async Task<CryptoPrice?> GetPriceAsync(string symbol)
        {
            var coinId = ToCoinId(symbol);
            var cacheKey = $"price:{coinId}";

            if (_cache.TryGetValue(cacheKey, out CryptoPrice? cached))
            {
                return cached;
            }

            var response = await _httpClient.GetAsync($"api/v3/simple/price?ids={coinId}&vs_currencies=usd&include_24hr_change=true");
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
            decimal? change = coinElement.TryGetProperty("usd_24h_change", out var changeElement) && changeElement.ValueKind == JsonValueKind.Number
                ? changeElement.GetDecimal()
                : null;
            var result = new CryptoPrice(symbol.ToUpper(), price, change);
            _cache.Set(cacheKey, result, PriceCacheTtl);
            return result;
        }

        public async Task<List<CryptoPrice>> GetPricesAsync(IEnumerable<string> symbols)
        {
            var symbolList = symbols.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
            if (symbolList.Count == 0)
            {
                return new List<CryptoPrice>();
            }

            var coinIdToSymbol = symbolList.ToDictionary(ToCoinId, s => s.ToUpper(), StringComparer.OrdinalIgnoreCase);

            var results = new List<CryptoPrice>();
            var uncachedCoinIds = new List<string>();

            foreach (var coinId in coinIdToSymbol.Keys)
            {
                if (_cache.TryGetValue($"price:{coinId}", out CryptoPrice? cached) && cached is not null)
                {
                    results.Add(cached);
                }
                else
                {
                    uncachedCoinIds.Add(coinId);
                }
            }

            if (uncachedCoinIds.Count == 0)
            {
                return results;
            }

            var idsParam = string.Join(",", uncachedCoinIds);
            var response = await _httpClient.GetAsync($"api/v3/simple/price?ids={idsParam}&vs_currencies=usd&include_24hr_change=true");
            if (!response.IsSuccessStatusCode)
            {
                return results;
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            foreach (var coinId in uncachedCoinIds)
            {
                var symbol = coinIdToSymbol[coinId];
                if (doc.RootElement.TryGetProperty(coinId, out var coinElement) &&
                    coinElement.TryGetProperty("usd", out var usdElement))
                {
                    decimal? change = coinElement.TryGetProperty("usd_24h_change", out var changeElement) && changeElement.ValueKind == JsonValueKind.Number
                        ? changeElement.GetDecimal()
                        : null;
                    var result = new CryptoPrice(symbol, usdElement.GetDecimal(), change);
                    _cache.Set($"price:{coinId}", result, PriceCacheTtl);
                    results.Add(result);
                }
            }

            return results;
        }

        public async Task<List<PricePoint>> GetPriceHistoryAsync(string symbol, int days)
        {
            var coinId = ToCoinId(symbol);
            var cacheKey = $"history:{coinId}:{days}";

            if (_cache.TryGetValue(cacheKey, out List<PricePoint>? cached) && cached is not null)
            {
                return cached;
            }

            var response = await _httpClient.GetAsync($"api/v3/coins/{coinId}/market_chart?vs_currency=usd&days={days}");
            if (!response.IsSuccessStatusCode)
            {
                return new List<PricePoint>();
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            if (!doc.RootElement.TryGetProperty("prices", out var pricesElement))
            {
                return new List<PricePoint>();
            }

            var points = new List<PricePoint>();
            foreach (var entry in pricesElement.EnumerateArray())
            {
                var timestamp = entry[0].GetInt64();
                var price = entry[1].GetDecimal();
                points.Add(new PricePoint(timestamp, price));
            }

            _cache.Set(cacheKey, points, HistoryCacheTtl);
            return points;
        }
    }
}
