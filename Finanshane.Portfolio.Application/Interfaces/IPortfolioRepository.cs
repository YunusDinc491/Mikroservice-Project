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
    }
}
