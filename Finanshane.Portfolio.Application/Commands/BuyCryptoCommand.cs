using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace Finanshane.Portfolio.Application.Commands
{
    public record BuyCryptoCommand(Guid UserId, string Symbol, decimal AmountUsd) : IRequest<BuyCryptoResult>;

    public record BuyCryptoResult(string Symbol, decimal Quantity, decimal PricePerUnit, decimal RemainingCashBalance);
}
