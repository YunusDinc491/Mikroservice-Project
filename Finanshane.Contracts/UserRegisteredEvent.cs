using System;
using System.Collections.Generic;
using System.Text;

namespace Finanshane.Contracts
{
    public record UserRegisteredEvent(Guid UserId, string Email, string PreferredCurrency);
    
}
