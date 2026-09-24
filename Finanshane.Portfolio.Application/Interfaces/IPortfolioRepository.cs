using Finanshane.Portfolio.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Finanshane.Portfolio.Application.Interfaces
{
    public interface IPortfolioRepository
    {
        Task<PortfolioAccount?> GetByUserIdAsync(Guid userId);
        Task AddAsync(PortfolioAccount portfolioAccount);
        Task<Holding?> GetHoldingAsync(Guid portfolioId, string symbol);
        Task AddHoldingAsync(Holding holding);
        Task<List<Holding>> GetHoldingsAsync(Guid portfolioId);
        Task AddTransactionAsync(Transaction transaction);
        Task<List<Transaction>> GetTransactionsAsync(Guid portfolioId, int limit);
        Task SaveChangesAsync();
    }
}
