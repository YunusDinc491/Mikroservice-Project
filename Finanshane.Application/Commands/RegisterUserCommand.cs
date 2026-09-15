using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Finanshane.Application.Commands
{
    public record RegisterUserCommand(
        string Email,
        string Password,
        string PreferredCurrency)
        : IRequest<Guid>; // ben bir MediatR isteğiyim, işlendiğimde geriye bir Guid (yeni kullanıcının Id'si) döneceğim" demek

}

