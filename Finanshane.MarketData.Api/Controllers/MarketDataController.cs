using Finanshane.MarketData.Application.Interfaces;
using Finanshane.MarketData.Infrastructure.ExternalApis;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;

namespace Finanshane.MarketData.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MarketDataController : ControllerBase
    {

        private readonly ICryptoPriceService _cryptoPriceService;

        public MarketDataController(ICryptoPriceService cryptoPriceService)
        {
            _cryptoPriceService = cryptoPriceService;
        }

        [HttpGet("crypto/{symbol}")]

        public async Task<IActionResult> GetCryptoPrice(string symbol)
        {
            var price = await _cryptoPriceService.GetPriceAsync(symbol);
            if (price == null)
            {
                return NotFound ();
                    }
            return Ok(price);

        }

        [HttpGet("crypto")]
        public async Task<IActionResult> GetCryptoPrices([FromQuery] string symbols)
        {
            if (string.IsNullOrWhiteSpace(symbols))
            {
                return BadRequest(new { message = "symbols parametresi gerekli." });
            }

            var symbolList = symbols.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            var prices = await _cryptoPriceService.GetPricesAsync(symbolList);
            return Ok(prices);
        }

        [HttpGet("crypto/{symbol}/history")]
        public async Task<IActionResult> GetCryptoPriceHistory(string symbol, [FromQuery] int days = 1)
        {
            var history = await _cryptoPriceService.GetPriceHistoryAsync(symbol, days);
            return Ok(history);
        }

        [HttpGet("symbols")]
        public IActionResult GetSupportedSymbols()
        {
            return Ok(CoinGeckoService.SymbolToCoinId.Keys.Select(s => s.ToUpper()).OrderBy(s => s));
        }
    }
}
