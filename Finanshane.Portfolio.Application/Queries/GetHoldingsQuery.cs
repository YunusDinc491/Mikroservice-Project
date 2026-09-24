using Finanshane.Portfolio.Domain.Entities;
using MediatR;
using System;
using System.Collections.Generic;

namespace Finanshane.Portfolio.Application.Queries
{
    public record GetHoldingsQuery(Guid UserId) : IRequest<List<Holding>>;
}
