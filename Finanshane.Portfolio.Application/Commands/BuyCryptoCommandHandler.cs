using Finanshane.Portfolio.Application.Interfaces;
using Finanshane.Portfolio.Domain.Entities;
using MediatR;
using System;
using System.Collections.Generic;
using System.Text;
using System.Text.RegularExpressions;

namespace Finanshane.Portfolio.Application.Commands
{
    public class BuyCryptoCommandHandler : IRequestHandler<BuyCryptoCommand, BuyCryptoResult>
    {
        private static readonly Regex SymbolPattern = new(@"^[a-zA-Z0-9-]{1,30}$", RegexOptions.Compiled);

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

            var symbol = request.Symbol?.Trim().ToLowerInvariant() ?? string.Empty;
            if (!SymbolPattern.IsMatch(symbol))
            {
                throw new InvalidOperationException("Gecersiz sembol.");
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

            var price = await _marketDataClient.GetPriceAsync(symbol);
            if (price is null || price <= 0)
            {
                throw new InvalidOperationException("Fiyat bilgisi alinamadi.");
            }

            var quantity = request.AmountUsd / price.Value;

            var holding = await _portfolioRepository.GetHoldingAsync(portfolio.Id, symbol);
            if (holding is null)
            {
                holding = new Holding
                {
                    Id = Guid.NewGuid(),
                    PortfolioId = portfolio.Id,
                    Symbol = symbol,
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

            return new BuyCryptoResult(symbol, quantity, price.Value, portfolio.CashBalance);
        }
    }
}
