using Finanshane.Portfolio.Application.Interfaces;
using Finanshane.Portfolio.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Microsoft.EntityFrameworkCore;
namespace Finanshane.Portfolio.Infrastructure.Persistence
{
    public class PortfolioRepository : IPortfolioRepository
    {
        private readonly PortfolioDbContext _context;

        public PortfolioRepository(PortfolioDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(PortfolioAccount portfolioAccount)
        {
            _context.PortfolioAccounts.Add(portfolioAccount);
            await _context.SaveChangesAsync();

        }

        public async Task<PortfolioAccount?> GetByUserIdAsync(Guid userId)
        {
            return await _context.PortfolioAccounts.FirstOrDefaultAsync(p => p.UserId == userId);
        }

        public async Task<Holding?> GetHoldingAsync(Guid portfolioId, string symbol)
        {
            return await _context.Holdings.FirstOrDefaultAsync(h => h.PortfolioId == portfolioId && h.Symbol == symbol);
        }

        public async Task AddHoldingAsync(Holding holding)
        {
            await _context.Holdings.AddAsync(holding);
        }

        public async Task<List<Holding>> GetHoldingsAsync(Guid portfolioId)
        {
            return await _context.Holdings.Where(h => h.PortfolioId == portfolioId).ToListAsync();
        }

        public async Task AddTransactionAsync(Transaction transaction)
        {
            await _context.Transactions.AddAsync(transaction);
        }

        public async Task<List<Transaction>> GetTransactionsAsync(Guid portfolioId, int limit)
        {
            return await _context.Transactions
                .Where(t => t.PortfolioId == portfolioId)
                .OrderByDescending(t => t.CreatedAt)
                .Take(limit)
                .ToListAsync();
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
