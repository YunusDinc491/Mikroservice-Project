using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Finanshane.Domain.Entities;

public class User
{
    public Guid Id { get; set; } //Guid id kullanıyoruz, birden fazla servis ve veritabanı olduğunda idler çakışma riski olmasın diye
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string PreferredCurrency { get; set; } = "USD";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
