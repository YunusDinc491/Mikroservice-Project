using Finanshane.Portfolio.Application.Interfaces;
using Finanshane.Portfolio.Domain.Entities;
using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace Finanshane.Portfolio.Application.Queries
{
    public class GetPortfolioQueryHandler : IRequestHandler<GetPortfolioQuery, PortfolioAccount?>
    {
        private readonly IPortfolioRepository _portfolioRepository;

        public GetPortfolioQueryHandler(IPortfolioRepository portfolioRepository)
        {
            _portfolioRepository = portfolioRepository;
        }

        public async Task<PortfolioAccount?> Handle(GetPortfolioQuery request, CancellationToken cancellationToken)
        {
           return await _portfolioRepository.GetByUserIdAsync(request.UserId);
        }
    }
}
