using Finanshane.Portfolio.Domain.Entities;
using MediatR;
using System;
using System.Collections.Generic;

namespace Finanshane.Portfolio.Application.Queries
{
    public record GetTransactionsQuery(Guid UserId, int Limit = 20) : IRequest<List<Transaction>>;
}
