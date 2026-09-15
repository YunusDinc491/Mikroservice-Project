using Finanshane.Portfolio.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;

using System.Text;

namespace Finanshane.Portfolio.Infrastructure.Persistence
{
    public class PortfolioDbContext : DbContext
    {
        public PortfolioDbContext(DbContextOptions<PortfolioDbContext> options) : base(options) { }

        public DbSet<PortfolioAccount> PortfolioAccounts => Set<PortfolioAccount>();
        public DbSet<Holding> Holdings => Set<Holding>();



    }
}
