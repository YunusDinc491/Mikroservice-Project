using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace Finanshane.Portfolio.Application.Commands
{
    public record SellCryptoCommand(Guid UserId, string Symbol, decimal Quantity) : IRequest<SellCryptoResult>;

    public record SellCryptoResult(string Symbol, decimal Quantity, decimal PricePerUnit, decimal ReceivedUsd, decimal NewCashBalance);
}
