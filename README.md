# Finanshane

Mikroservis mimarili bir kripto portföy uygulaması: kimlik doğrulama, portföy/varlık yönetimi, alım-satım ve canlı piyasa verisi servislerinden oluşur; önlerinde bir API Gateway (YARP) bulunur. `Finanshane.Web` klasöründe React/TypeScript tabanlı bir frontend içerir.

## Mimari

| Servis | Klasör | Sorumluluk | Docker portu |
|---|---|---|---|
| Gateway | `Finanshane.Gateaway` | Reverse proxy (YARP), CORS, rate limiting | `8080` |
| Identity | `Finanshane` | Kayıt/giriş, JWT üretimi | `8081` |
| Portfolio | `Finanshane.Portfolio.Api` | Bakiye, varlıklar, alım-satım, işlem geçmişi | `8082` |
| MarketData | `Finanshane.MarketData.Api` | CoinGecko üzerinden canlı fiyat/24s değişim/geçmiş | `8083` |
| Frontend | `Finanshane.Web` | Vite + React + TS + Tailwind arayüzü | `5173` (dev) |

Identity ve Portfolio servisleri kendi Postgres veritabanlarına sahiptir, aralarında kullanıcı kaydı olayını RabbitMQ üzerinden haberleşirler (yeni kullanıcıya otomatik $10.000 deneme bakiyesi açılır).

Frontend her zaman **Gateway** üzerinden konuşur (`http://localhost:8080/api/...`), doğrudan alt servislere istek atmaz.

## Gereksinimler

- Docker Desktop (backend + veritabanları için)
- Node.js 18+ ve npm (frontend için)
- (Opsiyonel, Docker dışı lokal geliştirme için) .NET 10 SDK

## Kurulum (yeni bir bilgisayarda)

```bash
git clone https://github.com/YunusDinc491/Mikroservice-Project.git
cd Mikroservice-Project
cp .env.example .env
```

`.env` dosyasını açıp gerçek değerlerle doldurun:

```
POSTGRES_PASSWORD=...
JWT_KEY=...          # en az 32 karakter, rastgele bir secret
RABBITMQ_USER=...
RABBITMQ_PASSWORD=...
```

Backend'i ayağa kaldırın:

```bash
docker compose up -d --build
```

İlk açılışta her API kendi veritabanı migration'larını **otomatik olarak** uygular (Postgres konteyneri hazır olana kadar birkaç saniye yeniden dener) — elle `dotnet ef database update` çalıştırmanıza gerek yoktur.

Gateway ayakta mı kontrol edin:

```bash
curl http://localhost:8080/health
```

## Frontend

```bash
cd Finanshane.Web
cp .env.example .env      # varsayılan zaten http://localhost:8080'e işaret eder
npm install
npm run dev
```

`http://localhost:5173` adresinde açılır. `/register` üzerinden hesap oluşturup giriş yapabilirsiniz.

## Notlar

- MarketData servisi CoinGecko'nun **ücretsiz** public API'sini kullanır; sık istekte rate limit (429) yiyebilir. Bunu azaltmak için backend'de kısa süreli bellek-içi önbellek (fiyat: 30sn, geçmiş grafik: 2dk) vardır.
- Desteklenen kripto sembolleri `GET /api/MarketData/symbols` ile listelenir; alım-satım ekranındaki otomatik tamamlama bu listeyi kullanır ve listede olmayan bir sembolle işlem yapılamaz.
- `appsettings.Development.json` dosyaları (her serviste) `.gitignore` ile hariç tutulmuştur — bunlar yalnızca Docker'sız/lokal `dotnet run` ile çalıştırmak isterseniz gerekir; içerikleri `.env`'deki değerlerle aynı yapıyı (ConnectionStrings, Jwt, RabbitMq) izler.
