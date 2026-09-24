using Finanshane.Portfolio.Application.Interfaces;
using MediatR;
using System;
using System.Collections.Generic;
using System.Text;
using System.Text.RegularExpressions;

namespace Finanshane.Portfolio.Application.Commands
{
    public class SellCryptoCommandHandler : IRequestHandler<SellCryptoCommand, SellCryptoResult>
    {
        private static readonly Regex SymbolPattern = new(@"^[a-zA-Z0-9-]{1,30}$", RegexOptions.Compiled);

        private readonly IPortfolioRepository _portfolioRepository;
        private readonly IMarketDataClient _marketDataClient;

        public SellCryptoCommandHandler(IPortfolioRepository portfolioRepository, IMarketDataClient marketDataClient)
        {
            _portfolioRepository = portfolioRepository;
            _marketDataClient = marketDataClient;
        }

        public async Task<SellCryptoResult> Handle(SellCryptoCommand request, CancellationToken cancellationToken)
        {
            if (request.Quantity <= 0)
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

            var holding = await _portfolioRepository.GetHoldingAsync(portfolio.Id, symbol);
            if (holding is null || holding.Quantity < request.Quantity)
            {
                throw new InvalidOperationException("Yetersiz miktar.");
            }

            var price = await _marketDataClient.GetPriceAsync(symbol);
            if (price is null || price <= 0)
            {
                throw new InvalidOperationException("Fiyat bilgisi alinamadi.");
            }

            var receivedUsd = request.Quantity * price.Value;

            holding.Quantity -= request.Quantity;
            portfolio.CashBalance += receivedUsd;

            await _portfolioRepository.SaveChangesAsync();

            return new SellCryptoResult(symbol, request.Quantity, price.Value, receivedUsd, portfolio.CashBalance);
        }
    }
}
