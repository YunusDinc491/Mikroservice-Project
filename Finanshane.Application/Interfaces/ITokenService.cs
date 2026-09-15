using Finanshane.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Finanshane.Application.Interfaces
{
    public interface ITokenService
    {
        string GenerateToken(User user);
    }
}
