using Finanshane.Portfolio.Application.Queries;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Finanshane.Portfolio.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]

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
            var portfolio = await _mediator.Send(new GetPortfolioQuery(userId));

            if (portfolio is null)
            {
                return NotFound();
            }
            return Ok(portfolio);
        }

    }
}
