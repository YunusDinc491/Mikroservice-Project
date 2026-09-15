using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace Finanshane.Application.Queries
{
    public record LoginQuery(string Email, string Password) : IRequest<string>;
    
}
