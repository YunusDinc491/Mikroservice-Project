using Finanshane.Portfolio.Application.Interfaces;
using Finanshane.Portfolio.Domain.Entities;
using MediatR;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Finanshane.Portfolio.Application.Queries
{
    public class GetTransactionsQueryHandler : IRequestHandler<GetTransactionsQuery, List<Transaction>>
    {
        private readonly IPortfolioRepository _portfolioRepository;

        public GetTransactionsQueryHandler(IPortfolioRepository portfolioRepository)
        {
            _portfolioRepository = portfolioRepository;
        }

        public async Task<List<Transaction>> Handle(GetTransactionsQuery request, CancellationToken cancellationToken)
        {
            var portfolio = await _portfolioRepository.GetByUserIdAsync(request.UserId);
            if (portfolio is null)
            {
                return new List<Transaction>();
            }

            return await _portfolioRepository.GetTransactionsAsync(portfolio.Id, request.Limit);
        }
    }
}
