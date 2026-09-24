using Finanshane.Portfolio.Application.Interfaces;
using Finanshane.Portfolio.Domain.Entities;
using MediatR;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Finanshane.Portfolio.Application.Queries
{
    public class GetHoldingsQueryHandler : IRequestHandler<GetHoldingsQuery, List<Holding>>
    {
        private readonly IPortfolioRepository _portfolioRepository;

        public GetHoldingsQueryHandler(IPortfolioRepository portfolioRepository)
        {
            _portfolioRepository = portfolioRepository;
        }

        public async Task<List<Holding>> Handle(GetHoldingsQuery request, CancellationToken cancellationToken)
        {
            var portfolio = await _portfolioRepository.GetByUserIdAsync(request.UserId);
            if (portfolio is null)
            {
                return new List<Holding>();
            }

            return await _portfolioRepository.GetHoldingsAsync(portfolio.Id);
        }
    }
}
