using Finanshane.Portfolio.Application.Interfaces;
using Finanshane.Portfolio.Domain.Entities;
using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace Finanshane.Portfolio.Application.Commands
{
    public class BuyCryptoCommandHandler : IRequestHandler<BuyCryptoCommand, BuyCryptoResult>
    {
        private readonly IPortfolioRepository _portfolioRepository;
        private readonly IMarketDataClient _marketDataClient;

        public BuyCryptoCommandHandler(IPortfolioRepository portfolioRepository, IMarketDataClient marketDataClient)
        {
            _portfolioRepository = portfolioRepository;
            _marketDataClient = marketDataClient;
        }

        public async Task<BuyCryptoResult> Handle(BuyCryptoCommand request, CancellationToken cancellationToken)
        {
            if (request.AmountUsd <= 0)
            {
                throw new InvalidOperationException("Gecersiz miktar.");
            }

            var portfolio = await _portfolioRepository.GetByUserIdAsync(request.UserId);
            if (portfolio is null)
            {
                throw new InvalidOperationException("Portfoy bulunamadi.");
            }

            if (portfolio.CashBalance < request.AmountUsd)
            {
                throw new InvalidOperationException("Yetersiz bakiye.");
            }

            var price = await _marketDataClient.GetPriceAsync(request.Symbol);
            if (price is null || price <= 0)
            {
                throw new InvalidOperationException("Fiyat bilgisi alinamadi.");
            }

            var quantity = request.AmountUsd / price.Value;

            var holding = await _portfolioRepository.GetHoldingAsync(portfolio.Id, request.Symbol);
            if (holding is null)
            {
                holding = new Holding
                {
                    Id = Guid.NewGuid(),
                    PortfolioId = portfolio.Id,
                    Symbol = request.Symbol,
                    Quantity = quantity
                };
                await _portfolioRepository.AddHoldingAsync(holding);
            }
            else
            {
                holding.Quantity += quantity;
            }

            portfolio.CashBalance -= request.AmountUsd;

            await _portfolioRepository.SaveChangesAsync();

            return new BuyCryptoResult(request.Symbol, quantity, price.Value, portfolio.CashBalance);
        }
    }
}
