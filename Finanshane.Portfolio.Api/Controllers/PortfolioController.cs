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

    }
}
