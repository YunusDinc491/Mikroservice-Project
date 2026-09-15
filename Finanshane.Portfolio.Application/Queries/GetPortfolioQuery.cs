using Finanshane.Portfolio.Domain.Entities;
using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace Finanshane.Portfolio.Application.Queries
{
    public record GetPortfolioQuery(Guid UserId) : IRequest<PortfolioAccount>;
    
}
