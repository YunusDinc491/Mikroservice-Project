using BCrypt.Net;
using Finanshane.Application.Interfaces;
using Finanshane.Domain.Entities;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MassTransit;
using Finanshane.Contracts;

namespace Finanshane.Application.Commands
{
    internal class RegisterUserCommandHandler : IRequestHandler<RegisterUserCommand, Guid>
    {
        private readonly IUserRepository _userRepository;
        private readonly IPublishEndpoint _publishEndpoint;
        public RegisterUserCommandHandler(IUserRepository userRepository, IPublishEndpoint publishEndpoint)
        {
            _userRepository = userRepository;
            _publishEndpoint = publishEndpoint;
        }

        public async Task<Guid> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
        {
            var existingUser = await _userRepository.GetByEmailAsync(request.Email);
            if (existingUser is not null)
            {
                throw new InvalidOperationException("Bu email adresi zaten kayıtlı.");
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                PreferredCurrency = request.PreferredCurrency
            };
            await _userRepository.AddAsync(user);

            await _publishEndpoint.Publish(new UserRegisteredEvent(user.Id, user.Email, user.PreferredCurrency));
            return user.Id;

        }
    }
}
