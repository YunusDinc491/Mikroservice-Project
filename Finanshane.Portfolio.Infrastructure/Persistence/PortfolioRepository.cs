using Finanshane.Portfolio.Application.Interfaces;
using Finanshane.Portfolio.Domain.Entities;
using System;
using System.Collections.Generic;
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
    }
}
