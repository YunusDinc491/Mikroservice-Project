using Finanshane.Portfolio.Application.Commands;
using Finanshane.Portfolio.Application.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Finanshane.Portfolio.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PortfolioController : ControllerBase
    {

        private readonly IMediator _mediator;

        public PortfolioController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetByUserId(Guid userId)
        {


            var tokenUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (tokenUserId == null || tokenUserId != userId.ToString())
            {
                return Forbid();
            }


            var portfolio = await _mediator.Send(new GetPortfolioQuery(userId));

            if (portfolio is null)
            {
                return NotFound();
            }
            return Ok(portfolio);
        }

        [HttpGet("{userId}/holdings")]
        public async Task<IActionResult> GetHoldings(Guid userId)
        {
            var tokenUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (tokenUserId == null || tokenUserId != userId.ToString())
            {
                return Forbid();
            }

            var holdings = await _mediator.Send(new GetHoldingsQuery(userId));
            return Ok(holdings);
        }

        [HttpGet("{userId}/transactions")]
        public async Task<IActionResult> GetTransactions(Guid userId, [FromQuery] int limit = 20)
        {
            var tokenUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (tokenUserId == null || tokenUserId != userId.ToString())
            {
                return Forbid();
            }

            var transactions = await _mediator.Send(new GetTransactionsQuery(userId, limit));
            return Ok(transactions);
        }

        [HttpPost("{userId}/buy")]
        public async Task<IActionResult> Buy(Guid userId, [FromBody] BuyRequest request)
        {
            var tokenUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (tokenUserId == null || tokenUserId != userId.ToString())
            {
                return Forbid();
            }

            try
            {
                var result = await _mediator.Send(new BuyCryptoCommand(userId, request.Symbol, request.AmountUsd));
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{userId}/sell")]
        public async Task<IActionResult> Sell(Guid userId, [FromBody] SellRequest request)
        {
            var tokenUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (tokenUserId == null || tokenUserId != userId.ToString())
            {
                return Forbid();
            }

            try
            {
                var result = await _mediator.Send(new SellCryptoCommand(userId, request.Symbol, request.Quantity));
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

    }

    public record BuyRequest(string Symbol, decimal AmountUsd);
    public record SellRequest(string Symbol, decimal Quantity);
}
