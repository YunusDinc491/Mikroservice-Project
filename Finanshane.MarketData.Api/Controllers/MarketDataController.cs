using Finanshane.MarketData.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

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
    }
}
