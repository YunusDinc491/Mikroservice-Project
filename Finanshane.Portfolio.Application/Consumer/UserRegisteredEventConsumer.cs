using Finanshane.Contracts;
using Finanshane.Portfolio.Application.Interfaces;
using Finanshane.Portfolio.Domain.Entities;
using MassTransit;
using System;
using System.Collections.Generic;
using System.Text;

namespace Finanshane.Portfolio.Application.Consumer
{
    public class UserRegisteredEventConsumer : IConsumer<UserRegisteredEvent>
    {
        private readonly IPortfolioRepository _portfolioRepository;

        public UserRegisteredEventConsumer(IPortfolioRepository portfolioRepository)
        {
            _portfolioRepository = portfolioRepository;
        }

        public async Task Consume(ConsumeContext<UserRegisteredEvent> context)
        {
            var message = context.Message;

            var portfolioAccount = new PortfolioAccount
            {
                Id = Guid.NewGuid(),
                UserId = message.UserId,
                CashBalance = 10000m, // sondaki m C#'ta bir sayı literalinin decimal tipinde olduğunu belirtir
                Currency = message.PreferredCurrency
            };
            await _portfolioRepository.AddAsync(portfolioAccount);
        }
    }
}
