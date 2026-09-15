using Finanshane.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Finanshane.Application.Interfaces
{
    public interface IUserRepository
    {
        Task<User?> GetByEmailAsync(string email); //<< login sırasında "bu email ile kayıtlı biri var mı" diye sorgulamak, ayrıca register sırasında "bu email zaten alınmış mı" kontrolü için
        Task AddAsync(User user); // yeni kullanıcıyı kaydetmek
    }
}
