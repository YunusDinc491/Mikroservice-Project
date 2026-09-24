# Finanshane

Mikroservis mimarili bir kripto portföy simülasyon uygulaması. Kullanıcılar kayıt olur, $10.000 deneme bakiyesiyle başlar, kripto piyasa fiyatlarını (CoinGecko üzerinden) görür ve alım-satım yapar. Backend 4 bağımsız .NET servisinden, frontend ise ayrı bir React/TypeScript uygulamasından oluşur.

Bu doküman, projeyi hiç görmemiş birinin A'dan Z'ye anlayabilsin diye yazıldı: mimari, veri modelleri, tüm API uçları, frontend yapısı, güvenlik kararları, yapılan testler ve sonuçları, bilinen sınırlamalar ve yapılabilecekler dahil.

---

## İçindekiler

1. [Mimari Genel Bakış](#1-mimari-genel-bakış)
2. [Servisler ve Sorumlulukları](#2-servisler-ve-sorumlulukları)
3. [Veri Modelleri (Veritabanı Şemaları)](#3-veri-modelleri-veritabanı-şemaları)
4. [Servisler Arası İletişim](#4-servisler-arası-iletişim)
5. [Kimlik Doğrulama ve Güvenlik](#5-kimlik-doğrulama-ve-güvenlik)
6. [API Referansı (tüm endpoint'ler)](#6-api-referansı-tüm-endpointler)
7. [Frontend Mimarisi](#7-frontend-mimarisi)
8. [Ortam Değişkenleri Referansı](#8-ortam-değişkenleri-referansı)
9. [Kurulum ve Çalıştırma](#9-kurulum-ve-çalıştırma)
10. [Docker & Altyapı Detayları](#10-docker--altyapı-detayları)
11. [Yapılan Testler ve Sonuçları](#11-yapılan-testler-ve-sonuçları)
12. [Bilinen Sınırlamalar / Yapılmayanlar](#12-bilinen-sınırlamalar--yapılmayanlar)
13. [Yapılabilecekler (Yol Haritası)](#13-yapılabilecekler-yol-haritası)
14. [Proje Geçmişi (Commit Özeti)](#14-proje-geçmişi-commit-özeti)
15. [Dosya/Klasör Haritası](#15-dosyaklasör-haritası)

---

## 1. Mimari Genel Bakış

```
                                   ┌─────────────────────┐
                                   │   Finanshane.Web     │  (Vite + React 19 + TS + Tailwind)
                                   │   localhost:5173      │
                                   └──────────┬────────────┘
                                              │  HTTP (fetch), Authorization: Bearer <JWT>
                                              ▼
                                   ┌─────────────────────┐
                                   │  Finanshane.Gateaway  │  YARP reverse proxy
                                   │  localhost:8080        │  CORS + rate limiting (100 req/dk)
                                   └──────────┬────────────┘
                     ┌────────────────────────┼────────────────────────┐
                     ▼                        ▼                        ▼
          ┌─────────────────┐      ┌─────────────────────┐   ┌──────────────────────┐
          │ Finanshane (Id.)  │      │ Finanshane.Portfolio  │   │ Finanshane.MarketData  │
          │ :8081             │      │ .Api  :8082            │   │ .Api  :8083             │
          │ Kayıt/Giriş, JWT  │      │ Bakiye/Varlık/İşlem    │   │ CoinGecko proxy +      │
          └────────┬──────────┘      └──────┬────────┬───────┘   │ bellek-içi cache       │
                   │                        │        │            └───────────┬────────────┘
                   │ RabbitMQ                │        │ HTTP (senkron)         │
                   │ UserRegisteredEvent      │        └────────────────────────┘
                   ▼                        ▼                                  │
          ┌─────────────┐         ┌───────────────────┐                        │
          │ identity-db  │         │  portfolio-db       │                        │
          │ Postgres 17  │         │  Postgres 17         │                        │
          │ :5434 (host) │         │  :5435 (host)         │                        │
          └─────────────┘         └───────────────────┘                        │
                                                                                  ▼
                                                                       CoinGecko public API
                                                                     (https://api.coingecko.com)
```

- **Frontend → Gateway**: tüm istekler `http://localhost:8080/api/...` üzerinden gider, hiçbir alt servise doğrudan bağlanmaz.
- **Identity → Portfolio**: senkron bağ yoktur. Kayıt olayı RabbitMQ üzerinden **asenkron** `UserRegisteredEvent` mesajıyla yayılır; Portfolio servisi bunu dinleyip yeni kullanıcı için $10.000 bakiyeli hesap açar.
- **Portfolio → MarketData**: alım/satım sırasında **senkron HTTP** isteğiyle anlık fiyat sorulur (`IMarketDataClient` → `MarketDataClient`, `MarketData:BaseUrl` config'inden).
- **MarketData → CoinGecko**: gerçek, ücretsiz, herkese açık CoinGecko API'sine HTTP isteği atar (API key gerektirmez, rate limitlidir — bkz. §12).

---

## 2. Servisler ve Sorumlulukları

| Servis | Proje klasörü | .csproj | Sorumluluk | Docker portu (host) | Container içi port |
|---|---|---|---|---|---|
| **Gateway** | `Finanshane.Gateaway` | `Finanshane.Gateway.csproj` | YARP reverse proxy, CORS, rate limiting, `/health` | `8080` | `8080` |
| **Identity** | `Finanshane` | `Finanshane.Api.csproj` | Kayıt, giriş, JWT üretimi | `8081` | `8080` |
| **Portfolio** | `Finanshane.Portfolio.Api` | `Finanshane.Portfolio.Api.csproj` | Bakiye, varlık (holding), alım/satım, işlem geçmişi | `8082` | `8080` |
| **MarketData** | `Finanshane.MarketData.Api` | `Finanshane.MarketData.Api.csproj` | CoinGecko'dan fiyat/24s değişim/geçmiş, bellek-içi cache | `8083` | `8080` |
| **Frontend** | `Finanshane.Web` | — (npm) | React SPA | `5173` (dev server) | — |
| identity-db | — | — | Identity servisi Postgres 17 veritabanı | `5434` (yalnız 127.0.0.1) | `5432` |
| portfolio-db | — | — | Portfolio servisi Postgres 17 veritabanı | `5435` (yalnız 127.0.0.1) | `5432` |
| rabbitmq | — | — | Mesaj kuyruğu (management UI dahil) | `5672`, `15672` (yalnız 127.0.0.1) | `5672`, `15672` |

**Solution'daki tüm projeler** (`FinanshaneProjesi.slnx`, IDE tarafından `.vs/` altında saklanır — 14 proje, her biri Clean Architecture katmanlarına göre ayrılmış):

- `Finanshane.Domain`, `Finanshane.Application`, `Finanshane.Infrastructure`, `Finanshane` (Api) — Identity servisi
- `Finanshane.Portfolio.Domain`, `Finanshane.Portfolio.Application`, `Finanshane.Portfolio.Infrastructure`, `Finanshane.Portfolio.Api` — Portfolio servisi
- `Finanshane.MarketData.Domain`, `Finanshane.MarketData.Application`, `Finanshane.MarketData.Infrastructure`, `Finanshane.MarketData.Api` — MarketData servisi
- `Finanshane.Gateaway` — Gateway
- `Finanshane.Contracts` — servisler arası paylaşılan event/mesaj sözleşmeleri (yalnızca `UserRegisteredEvent` içerir)

**Otomatik test projesi yoktur** — repodaki 14 `.csproj` dosyasından hiçbiri test projesi değildir (bkz. §12).

---

## 3. Veri Modelleri (Veritabanı Şemaları)

### 3.1 Identity DB (`identitydb`, Postgres, Npgsql/EF Core)

**Tablo: `Users`** (`Finanshane.Domain.Entities.User`, `IdentityDbContext`)

| Alan | Tip | Not |
|---|---|---|
| `Id` | `Guid` (PK) | |
| `Email` | `string` | Benzersizlik DB seviyesinde **zorlanmıyor** (index/unique constraint yok), yalnızca uygulama seviyesinde `GetByEmailAsync` ile kontrol ediliyor |
| `PasswordHash` | `string` | BCrypt hash'i (bkz. §5) |
| `PreferredCurrency` | `string` | Varsayılan `"USD"` |
| `CreatedAt` | `DateTime` | Varsayılan `DateTime.UtcNow` |

Migration: `20260912175036_InitialCreate`.

### 3.2 Portfolio DB (`portfoliodb`, Postgres, Npgsql/EF Core)

**Tablo: `PortfolioAccounts`** (`PortfolioAccount`)

| Alan | Tip | Not |
|---|---|---|
| `Id` | `Guid` (PK) | |
| `UserId` | `Guid` | Identity'deki `User.Id` ile eşleşir (foreign key **değil** — servisler ayrı DB kullandığı için mantıksal referans) |
| `CashBalance` | `decimal` | Kayıt anında `10000m` ile başlar |
| `Currency` | `string` | Kayıt sırasında seçilen `PreferredCurrency` |
| `CreatedAt` | `DateTime` | |

**Tablo: `Holdings`** (`Holding`)

| Alan | Tip | Not |
|---|---|---|
| `Id` | `Guid` (PK) | |
| `PortfolioId` | `Guid` | `PortfolioAccounts.Id`'ye mantıksal referans |
| `Symbol` | `string` | Küçük harfe çevrilip saklanır (örn. `"btc"`) |
| `Quantity` | `decimal` | |

Bir kullanıcının bir sembolden en fazla bir `Holding` satırı olur; ikinci alımda mevcut satırın `Quantity`'si artırılır (`GetHoldingAsync` ile aranır).

**Tablo: `Transactions`** (`Transaction`)

| Alan | Tip | Not |
|---|---|---|
| `Id` | `Guid` (PK) | |
| `PortfolioId` | `Guid` | |
| `Type` | `int` (enum `TransactionType`: `Buy=0`, `Sell=1`) | |
| `Symbol` | `string` | |
| `Quantity` | `decimal` | |
| `PricePerUnit` | `decimal` | İşlem anındaki birim fiyat |
| `TotalUsd` | `decimal` | Alımda harcanan, satımda elde edilen USD tutarı |
| `CreatedAt` | `DateTime` | |

Migrationlar (sırayla): `20260913164756_InitialCreate` (PortfolioAccounts + Holdings), `20260924110442_AddTransactions` (Transactions tablosu).

> Not: Hiçbir EF Core Fluent API konfigürasyonu (`OnModelCreating`) yoktur; tüm tablo/kolon adları EF Core konvansiyonlarıyla oluşur. `Holdings.PortfolioId` ve `Transactions.PortfolioId` üzerinde **index yoktur** (performans için ileride eklenmeli, bkz. §13).

---

## 4. Servisler Arası İletişim

### 4.1 Asenkron: RabbitMQ (MassTransit)

- **Mesaj**: `Finanshane.Contracts.UserRegisteredEvent(Guid UserId, string Email, string PreferredCurrency)` — sade bir `record`, MassTransit'e özgü bağımlılığı yok, hem Identity hem Portfolio projesi referans alır.
- **Yayıncı**: `RegisterUserCommandHandler` (Identity) — kullanıcı DB'ye yazıldıktan **hemen sonra** `IPublishEndpoint.Publish(...)` ile yayınlar.
- **Tüketici**: `UserRegisteredEventConsumer` (Portfolio) — mesajı alınca `CashBalance = 10000m` ile yeni bir `PortfolioAccount` oluşturur.
- **Sonuç**: Kayıt (`POST /api/Auth/register`) **anında** portföy hesabı oluşturmaz; bu, RabbitMQ üzerinden birkaç yüz milisaniye içinde asenkron gerçekleşir. Frontend bunu `getPortfolioWithRetry` ile tolere eder (bkz. §7 ve §11 — bu tam olarak test sırasında yakalanan bir yarış durumuydu).

### 4.2 Senkron: HTTP (Portfolio → MarketData)

- `IMarketDataClient` (Portfolio.Infrastructure/ExternalServices/MarketDataClient.cs), `MarketData:BaseUrl` adresine (docker-compose'da `http://marketdata-api:8080/`) `GET /api/MarketData/crypto/{symbol}` çağrısı yapar.
- Alım/satım komut handler'ları (`BuyCryptoCommandHandler`, `SellCryptoCommandHandler`) bu çağrıyı **her işlemde** yapar; fiyat cache'i Portfolio tarafında yoktur (cache yalnızca MarketData servisinin kendi içinde, CoinGecko'ya gidişi azaltmak için vardır — bkz. §5).

---

## 5. Kimlik Doğrulama ve Güvenlik

### 5.1 Parola saklama

- `BCrypt.Net-Next` kütüphanesi (`BCrypt.Net.BCrypt.HashPassword` / `.Verify`) — endüstri standardı, salt otomatik üretilir ve hash içine gömülür.
- Backend tarafında **parola uzunluğu/karmaşıklık doğrulaması yoktur** (frontend'de ≥6 karakter kontrolü var ama bu yalnızca UX, atlatılabilir — bkz. §12).
- E-posta formatı backend'de doğrulanmıyor (ne regex ne `[EmailAddress]` attribute'u var).

### 5.2 JWT

- Algoritma: **HS256** (`SecurityAlgorithms.HmacSha256`), simetrik anahtar (`Jwt:Key`, `.env`'deki `JWT_KEY`).
- Claim'ler (tam olarak 3 tane):
  | Claim | Kaynak | Örnek |
  |---|---|---|
  | `sub` | `User.Id` | `"6aab5365-..."` |
  | `email` | `User.Email` | `"test@finanshane.com"` |
  | `pereferredCurrency` | `User.PreferredCurrency` | `"USD"` |

  ⚠️ **`pereferredCurrency` claim adı kaynak kodda gerçekten bu şekilde yazılmış (typo — "preferred" değil "pereferred")**. Bu bilinçli bir düzeltme değil, mevcut davranışın belgelenmesidir; frontend (`TokenClaims` arayüzü, `src/lib/api.ts`) bu typo'yu bilerek aynen kullanır. Düzeltilirse hem backend hem frontend'de eşzamanlı değişmesi gerekir.
- Süre: `Jwt:ExpiryMinutes` config değeri (docker-compose'da `60` dakika olarak ayarlı).
- **Refresh token yoktur.** Süre dolunca kullanıcı tekrar giriş yapmak zorunda; frontend bunu otomatik yönetmez (bkz. §12).
- Sunucu tarafı doğrulama: `AddJwtBearer` ile `ValidateIssuer/Audience/Lifetime/IssuerSigningKey = true`, tüm alt servislerde (Identity hariç — Identity token'ı **üretir**, doğrulamaz) aynı `Jwt:Key/Issuer/Audience` ile yapılandırılmıştır.

### 5.3 Yetkilendirme / IDOR koruması

- `PortfolioController`'daki her endpoint, `[Authorize]` + route'taki `{userId}` parametresinin, JWT'deki `ClaimTypes.NameIdentifier` (ASP.NET Core'un `sub` claim'ini otomatik eşlediği claim) ile birebir aynı olup olmadığını kontrol eder; eşleşmezse `403 Forbidden` döner. Yani bir kullanıcı başka bir kullanıcının portföyünü **URL'yi değiştirerek** göremez/işlem yapamaz.
- MarketData servisi **kimlik doğrulama gerektirmez** (herkese açık fiyat verisi).

### 5.4 CORS

- Yalnızca **Gateway**'de tanımlıdır (`Finanshane.Gateaway/Program.cs`): `http://localhost:5173` origin'ine `AllowAnyHeader().AllowAnyMethod()`.
- Alt servislerde (Identity/Portfolio/MarketData) **CORS tanımlı değildir** — bu, Gateway bypass edilip servislere doğrudan (8081/8082/8083) istek atıldığında tarayıcıdan çağrının CORS hatası alacağı, ama **sunucu tarafında hiçbir engel olmadığı** anlamına gelir (bkz. §12, Y2).

### 5.5 Rate limiting

- Yalnızca Gateway'de: sabit pencere (`fixed window`), **100 istek/dakika**, aşılırsa `429 Too Many Requests`. Kullanıcı/IP bazlı değildir — tüm trafiğe ortak uygulanır.

### 5.6 Ağ izolasyonu

- `docker-compose.yml`'de Postgres (`5434`, `5435`) ve RabbitMQ (`5672`, `15672`) portları yalnızca `127.0.0.1`'e bağlanır (`127.0.0.1:5434:5432` gibi) — aynı ağdaki başka bir makineden erişilemez. Identity/Portfolio/MarketData API'leri (`8081`/`8082`/`8083`) ise **tüm arayüzlere** bağlanır (bkz. §12, Y2).

### 5.7 Girdi doğrulama (alım/satım sembolleri)

- `BuyCryptoCommandHandler` / `SellCryptoCommandHandler`: sembol `Trim().ToLowerInvariant()` ile normalize edilir, `^[a-zA-Z0-9-]{1,30}$` regex'iyle doğrulanır; miktar/tutar `<= 0` ise reddedilir.
- Frontend ayrıca `SymbolAutocomplete` bileşeniyle yalnızca `GET /api/MarketData/symbols`'ın döndürdüğü **16 sembolden birini** seçtirir — ama bu yalnızca UX katmanıdır, backend'e doğrudan `curl`/Postman ile listede olmayan (ama regex'e uyan) bir sembil gönderilirse, `MarketDataClient` CoinGecko'dan fiyat alamayacağı için `InvalidOperationException("Fiyat bilgisi alinamadi.")` → `400 Bad Request` ile reddedilir. Yani gerçek doğrulama backend'de fiyatın bulunup bulunamamasına dayanır, ayrı bir whitelist kontrolü **yoktur**.

---

## 6. API Referansı (tüm endpoint'ler)

Tüm örnekler Gateway üzerinden (`http://localhost:8080`) verilmiştir. `🔒` = `Authorization: Bearer <JWT>` gerektirir.

### 6.1 Identity (`/api/Auth`)

| Metot & yol | Auth | Body | Başarı | Hata |
|---|---|---|---|---|
| `POST /api/Auth/register` | — | `{ "email": string, "password": string, "preferredCurrency": string }` | `200 { "userId": guid }` | `400 { "message": "Bu email adresi zaten kayıtlı." }` |
| `POST /api/Auth/login` | — | `{ "email": string, "password": string }` | `200 { "token": string }` | `401 { "message": "Email veya şifre hatalı." }` |

### 6.2 Portfolio (`/api/Portfolio`) — tamamı `🔒`, hepsi `{userId}` route parametresinin token sahibine ait olmasını zorunlu kılar (aksi halde `403`)

| Metot & yol | Body | Başarı | Hata |
|---|---|---|---|
| `GET /api/Portfolio/{userId}` | — | `200 { "id", "userId", "cashBalance", "currency", "createdAt" }` | `404` (portföy henüz oluşmadıysa — RabbitMQ gecikmesi, bkz. §4.1), `403` |
| `GET /api/Portfolio/{userId}/holdings` **(yeni)** | — | `200 [ { "id", "portfolioId", "symbol", "quantity" }, ... ]` (boşsa `[]`) | `403` |
| `GET /api/Portfolio/{userId}/transactions?limit=20` **(yeni)** | — | `200 [ { "id", "portfolioId", "type" (0=Buy/1=Sell), "symbol", "quantity", "pricePerUnit", "totalUsd", "createdAt" }, ... ]` en yeni önce, varsayılan `limit=20` | `403` |
| `POST /api/Portfolio/{userId}/buy` | `{ "symbol": string, "amountUsd": decimal }` | `200 { "symbol", "quantity", "pricePerUnit", "remainingCashBalance" }` | `400` (yetersiz bakiye / geçersiz sembil / fiyat alınamadı), `403` |
| `POST /api/Portfolio/{userId}/sell` | `{ "symbol": string, "quantity": decimal }` | `200 { "symbol", "quantity", "pricePerUnit", "receivedUsd", "newCashBalance" }` | `400` (yetersiz miktar), `403` |

### 6.3 MarketData (`/api/MarketData`) — auth gerektirmez

| Metot & yol | Başarı | Not |
|---|---|---|
| `GET /api/MarketData/crypto/{symbol}` | `200 { "symbol", "priceUsd", "change24h": decimal\|null }` | `404` eşleşmezse/CoinGecko hata verirse |
| `GET /api/MarketData/crypto?symbols=btc,eth,...` **(yeni)** | `200 [ { "symbol", "priceUsd", "change24h" }, ... ]` | Çoklu sembolü **tek** CoinGecko çağrısında getirir (rate-limit koruması) |
| `GET /api/MarketData/crypto/{symbol}/history?days=1` **(yeni)** | `200 [ { "timestampMs", "priceUsd" }, ... ]` | CoinGecko `market_chart` uç noktasından; `days=1` ⇒ ~5 dakikalık aralıklarla ~288 nokta |
| `GET /api/MarketData/symbols` **(yeni)** | `200 ["ADA","AVAX","BNB","BTC","DOGE","DOT","ETH","LINK","LTC","MATIC","SOL","TON","TRX","USDC","USDT","XRP"]` | Desteklenen semboller — frontend otomatik tamamlama bunu kullanır |

**Desteklenen sembol → CoinGecko coin-id eşlemesi** (`CoinGeckoService.SymbolToCoinId`, tam liste): `btc→bitcoin, eth→ethereum, usdt→tether, usdc→usd-coin, bnb→binancecoin, sol→solana, xrp→ripple, ada→cardano, doge→dogecoin, ton→the-open-network, dot→polkadot, matic→matic-network, ltc→litecoin, avax→avalanche-2, trx→tron, link→chainlink`. Listede olmayan bir sembol gönderilirse, sembol küçük harfle **doğrudan CoinGecko coin-id'si olarak** denenir (örn. `bitcoin` yazarsanız çalışır ama `sol2` gibi bir şey 404 döner).

### 6.4 Health check

Her 4 serviste de `GET /health` → `200 "Healthy"` (ASP.NET Core `AddHealthChecks()`, herhangi bir bağımlılık kontrolü yapılmaz, yalnızca servisin ayakta olduğunu gösterir).

---

## 7. Frontend Mimarisi

**Stack**: Vite 8, React 19.2, TypeScript (~6.0), Tailwind CSS 3.4 (stok config, tüm stiller `arbitrary value` sınıflarıyla), `react-router-dom` 7.18, `lucide-react` 0.446 (ikonlar), lint aracı `oxlint`.

### 7.1 Routing (`src/App.tsx`)

```
/login              → LoginPage        (public)
/register           → RegisterPage     (public)
/  (index)          → OverviewPage     (protected) — "Dashboard"
/trade               → TradePage        (protected) — "Al / Sat"
/markets              → MarketsPage      (protected) — "Piyasalar"
/holdings             → HoldingsPage     (protected) — "Varlıklarım"
*                    → "/"'e yönlendirir
```

Protected route'lar `<ProtectedRoute />` (JWT yoksa/süresi dolmuşsa `/login`'e `Navigate`) → içinde `<AppShell />` layout route'u (üstte logo, kullanıcı e-postası, çıkış butonu, 4 sekmelik nav pill, `<Outlet />`).

### 7.2 Sayfa/bileşen envanteri (`src/`)

```
App.tsx                         Router kurulumu
main.tsx                        React root, StrictMode
index.css                       Tailwind + keyframe animasyonlar (fade-up/down/left/right/scale, bar-grow, drift)

components/
  Animate.tsx                   Giriş animasyonu sarmalayıcı (delay + direction prop'ları)
  Logo.tsx                      Finanshane SVG logosu
  AuthLayout.tsx                Login/Register ortak iskeleti (video arka plan + nav + 2 kolonlu hero)
  AppShell.tsx                  Korumalı sayfaların ortak kabuğu (üst nav + sekme pill'leri + Outlet)
  ProtectedRoute.tsx             JWT kontrolü + yönlendirme
  SymbolAutocomplete.tsx         Kripto sembol roll/dropdown autocomplete + geçersiz sembol reddi
  portfolio/
    BalanceCard.tsx              Nakit bakiye kartı (Dashboard'da kullanılır)
    PriceLookupCard.tsx          "Kripto Seç" arama + seçili kripto fiyat/24s tablosu (Piyasalar)
    SelectedCryptoChart.tsx      Al/Sat sayfasında seçili kriptonun SVG çizgi grafiği (24s, gradient dolgulu)
    TradeCard.tsx                Al/Sat formu (autocomplete + miktar + gönder)

pages/
  LoginPage.tsx                  Giriş formu, başarıda token kaydedip "/"'e yönlendirir
  RegisterPage.tsx               Kayıt formu (e-posta/şifre/şifre-tekrar/para birimi) → register + otomatik login
  OverviewPage.tsx                "Dashboard": bakiye kartı + 3 tıklanabilir kısayol kartı (Al-Sat/Piyasalar/Varlıklarım)
  TradePage.tsx                   Seçili kripto grafiği + Al/Sat kartları + oturum-içi işlem listesi
  MarketsPage.tsx                  "Kripto Seç" arama + 8 popüler coin tablosu (24s değişim oklu)
  HoldingsPage.tsx                 3 özet kart (Nakit/Kriptoda Kullanılan/Toplam) + kripto dökümü + kalıcı Son İşlemler

lib/
  api.ts                          Tüm backend çağrıları, tip tanımları, JWT decode/saklama
  format.ts                       `formatUsd` (Intl.NumberFormat tr-TR, USD)
  useSymbols.ts                   `/api/MarketData/symbols` için modül-seviyesi cache'li React hook
```

### 7.3 Kimlik doğrulama durumu (state) yönetimi

- Global state kütüphanesi (Redux/Zustand/Context) **kullanılmaz**. JWT `localStorage`'da `finanshane_token` anahtarıyla saklanır (`saveToken`/`getToken`/`clearToken`, `src/lib/api.ts`).
- `getCurrentUser()` her çağrıldığında token'ı decode eder (imza doğrulaması **yapmaz**, yalnızca payload'ı base64url çözer), `exp` süresi geçmişse token'ı otomatik siler ve `null` döner.
- Component'ler arası "kullanıcı kim" bilgisi, her sayfanın kendi içinde `getCurrentUser()` çağırmasıyla elde edilir — prop drilling veya context yoktur (küçük ölçekli bir uygulama için bilinçli basitlik).

### 7.4 Veri çekme deseni

- Özel bir veri katmanı (React Query/SWR) **yoktur**; her sayfa kendi `useEffect` + `useState` ile `src/lib/api.ts`'deki fonksiyonları çağırır.
- `getPortfolioWithRetry` (`api.ts`): kayıt sonrası RabbitMQ gecikmesine karşı `404` durumunda 700ms aralıklarla 5 kez yeniden dener (bkz. §4.1, §11).
- Piyasa fiyatları (`MarketsPage`, `HoldingsPage`) **toplu** (`getCryptoPrices`) çağrılır — N ayrı istek yerine tek istek, CoinGecko rate limit'ine karşı (bkz. §11'deki bulgu).

### 7.5 Tema / tasarım sistemi

- Tasarım dili: "Apogee" tarzı hero-section (koyu `#080A19` zemin, camsı/glassmorphic paneller `rgba(17,16,15,0.35–0.6)` + `backdrop-blur`, `cubic-bezier(0.16,1,0.3,1)` giriş animasyonları, `Inter` fontu — "Suisse Intl" için güvenilir bir CDN bulunamadığından Inter tercih edildi).
- Video arka plan: `Finanshane.Web/public/video/hero-bg.mp4` (kripto/altın temalı stok video, ~4.4MB), yalnızca `AuthLayout` (Login/Register) sayfalarında kullanılır; korumalı sayfalarda (`AppShell`) performans için statik gradient + grid arka plan kullanılır.
- Kaynak video dosyasının orijinali (`foto ve video/309316_medium.mp4`) repo köküne bilinçli olarak **eklenmedi** (`.gitignore`), çünkü kullanılan kopya zaten `Finanshane.Web/public/video/` altında.

---

## 8. Ortam Değişkenleri Referansı

### 8.1 Kök `.env` (docker-compose için, `.env.example`'dan kopyalanır)

| Değişken | Kullanan | Açıklama |
|---|---|---|
| `POSTGRES_PASSWORD` | identity-db, portfolio-db, identity-api, portfolio-api | Her iki Postgres konteyneri de **aynı** şifreyi kullanır |
| `JWT_KEY` | identity-api, portfolio-api | HS256 imzalama anahtarı, en az 32 karakter önerilir |
| `RABBITMQ_USER` / `RABBITMQ_PASSWORD` | rabbitmq, identity-api, portfolio-api | |

`docker-compose.yml`'de sabit kodlanmış (değiştirilmesi gerekmeyen) değerler: `Jwt:Issuer=FinanshaneIdentity`, `Jwt:Audience=FinanshaneClients`, `Jwt:ExpiryMinutes=60`.

### 8.2 `Finanshane.Web/.env` (`.env.example`'dan kopyalanır)

| Değişken | Varsayılan (kod içi fallback) | Açıklama |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080` | Gateway adresi; `.env` yoksa bile kod bu değere düşer (`src/lib/api.ts`) |

### 8.3 Docker dışı (lokal `dotnet run`) geliştirme için `appsettings.Development.json`

Her 4 serviste de `.gitignore` ile hariç tutulmuştur (bkz. `Finanshane/appsettings.json` gibi base dosyalardaki boş placeholder alanlar). Gerekliyse, base `appsettings.json`'daki anahtarları (`ConnectionStrings`, `Jwt`, `RabbitMq`) `.env`'deki değerlerle doldurup `Finanshane/appsettings.Development.json` vb. olarak oluşturun. Identity ve Portfolio için `ConnectionStrings:IdentityDb` / `ConnectionStrings:PortfolioDb`, lokal Postgres'e (host portları `5434`/`5435`) işaret etmeli.

---

## 9. Kurulum ve Çalıştırma

### 9.1 Gereksinimler

- Docker Desktop (backend + veritabanları)
- Node.js 18+ ve npm (frontend)
- (Opsiyonel) .NET 10 SDK — yalnızca Docker dışı geliştirme/migration komutları için

### 9.2 İlk kurulum

```bash
git clone https://github.com/YunusDinc491/Mikroservice-Project.git
cd Mikroservice-Project
cp .env.example .env      # sonra .env içindeki değerleri doldurun
docker compose up -d --build
```

İlk açılışta Identity ve Portfolio servisleri **veritabanı migration'larını otomatik uygular** (Postgres hazır olana kadar 3 saniye arayla en fazla 10 kez dener — bkz. §11'deki fresh-clone testi). Elle `dotnet ef database update` çalıştırmaya gerek yoktur.

```bash
curl http://localhost:8080/health   # "Healthy" dönmeli
```

### 9.3 Frontend

```bash
cd Finanshane.Web
cp .env.example .env
npm install
npm run dev            # http://localhost:5173
```

Diğer npm script'leri: `npm run build` (tsc + vite build), `npm run lint` (oxlint), `npm run preview`.

### 9.4 Servisleri tek tek yeniden build etmek

```bash
docker compose build <servis-adı>     # örn. portfolio-api
docker compose up -d <servis-adı>
```

### 9.5 Veritabanını sıfırlamak (dikkat: tüm veri silinir)

```bash
docker compose down -v
docker compose up -d
```

---

## 10. Docker & Altyapı Detayları

- Tüm 4 backend Dockerfile'ı **yapısal olarak özdeştir**: multi-stage build, `mcr.microsoft.com/dotnet/sdk:10.0` ile derleme, `mcr.microsoft.com/dotnet/aspnet:10.0` ile çalıştırma, container içinde `8080` portu dinlenir (`ASPNETCORE_URLS=http://+:8080`).
- `docker-compose.yml`'de `build.context: .` olduğu için her servisin Dockerfile'ı **tüm repo kökünü** build context'i olarak alır (`COPY . .`) — bu, herhangi bir dosya değiştiğinde o servisin Docker layer cache'inin bozulabileceği anlamına gelir (optimizasyon fırsatı, bkz. §13).
- `global.json` yoktur; SDK sürümü yalnızca Dockerfile'larda (`10.0`) sabitlenmiştir. Yerelde `dotnet --version` farklıysa (örn. `10.0.400`), derleme küçük uyarılarla da olsa çalışır.
- MassTransit sürümü `8.3.4`'e **düşürüldü** (commit `5ffe079`) — daha yeni sürümde yaşanan uyumluluk sorunu nedeniyle.

---

## 11. Yapılan Testler ve Sonuçları

Aşağıdaki testlerin tamamı **gerçek backend'e karşı, tarayıcı üzerinden** yapıldı — mock/stub kullanılmadı.

| # | Test | Sonuç | Bulgu/Aksiyon |
|---|---|---|---|
| 1 | Gateway CORS preflight (`OPTIONS /api/Auth/login`, `Origin: localhost:5173`) | ❌→✅ | Başlangıçta CORS hiç yapılandırılmamıştı (`405`), Gateway'e `AddCors`/`UseCors` eklendi → `204` + doğru header'lar |
| 2 | Uçtan uca kayıt → otomatik giriş → Dashboard yönlendirmesi | ✅ | `e2etest@finanshane.com` ile gerçek kayıt yapıldı, JWT alındı, `/`'e yönlendirildi |
| 3 | Kayıt sonrası ilk bakiye sorgusu | ❌→✅ | React StrictMode'un çift `useEffect` çağrısı + RabbitMQ'nun henüz portföy hesabını oluşturmamış olması birlikte bir yarış durumuna yol açtı: iki paralel `GET /api/Portfolio/{id}` isteğinden biri `404`, diğeri `200` döndü, state'e **son çözülen** (404) yazıldı → "Bir hata oluştu" göründü. `getPortfolioWithRetry` (404'te 700ms arayla 5 deneme) + `useEffect` cleanup'ta `cancelled` flag'i eklenerek düzeltildi |
| 4 | Gerçek alım (100$ BTC) | ✅ | CoinGecko'dan gerçek fiyatla (`$83.389`) `0.0011991989351113456 BTC` alındı, bakiye düştü, oturum-içi işlem listesinde göründü |
| 5 | `GET /api/Portfolio/{userId}/holdings` (yeni eklenen endpoint) | ✅ | Alınan BTC, Varlıklarım sayfasında doğru miktar/değerle listelendi — **backend'de kullanılmayan veri kalmaması için eklendi**: `Holding` satırları önceden DB'ye yazılıyordu ama hiçbir API bunu dışarı açmıyordu |
| 6 | Piyasalar sayfası — 8 coin paralel fiyat sorgusu | ❌→✅ | 8 ayrı `GET /api/MarketData/crypto/{symbol}` paralel isteği CoinGecko'nun ücretsiz API rate limit'ine (`429`) takıldı, tüm kartlar "—" gösterdi. Çözüm: backend'e `GET /api/MarketData/crypto?symbols=a,b,c` toplu endpoint'i eklendi, frontend tek istekle 8 fiyatı da aldı |
| 7 | Sembol autocomplete ("b" yazınca) | ✅ | `BNB`/`BTC` roll şeklinde listelendi, geçersiz sembol (`"B"` tek başına) kırmızı border + hata mesajıyla işaretlendi, gönderim engellendi |
| 8 | Al/Sat sayfası — seçili kripto grafiği | ❌→✅ (kısmi) | İlk denemede grafik "Grafik verisi alınamadı" gösterdi — backend loglarında CoinGecko'dan **gerçek `429`** görüldü (yine rate limit, bu kez tek-sembol fiyat + geçmiş endpoint'lerinin birlikte çağrılmasından). Backend'e `IMemoryCache` ile 30sn (fiyat) / 2dk (geçmiş) TTL cache eklendi; ayrıca frontend `Promise.all` → `Promise.allSettled`'a çevrilip, tek fiyat isteği başarısız olsa bile geçmiş veriden fiyat/değişim türetilerek grafiğin kısmi hataya dayanıklı olması sağlandı |
| 9 | 24 saatlik değişim okları (Piyasalar tablosu) | ✅ | CoinGecko `include_24hr_change=true` parametresiyle gerçek veriler çekildi; yükselen coin'ler yeşil ok (`+6.43%` LTC), düşenler kırmızı ok ile doğru gösterildi |
| 10 | Kalıcı işlem geçmişi (`Transactions` tablosu, yeni) | ✅ | ETH alımı yapıldı → `Varlıklarım` sayfası **navigasyon sonrası da** (yeniden fetch ile) işlemi gösterdi; eski (migration öncesi) BTC alımları haliyle görünmedi — bu beklenen davranış, geriye dönük veri üretilmedi |
| 11 | 3 özet kart matematiği (Nakit + Kriptoda Kullanılan = Toplam) | ✅ | `$9.750,00 + $250,17 = $10.000,17` — tutarlı |
| 12 | Dekoratif arka plan taşması (yatay scrollbar) | ❌→✅ | `AppShell`'deki dekoratif gradient `div`'i (`-right-[10%]`) viewport dışına taşıp `scrollWidth`'i 123px artırıyordu; kök `div`'e `overflow-x-hidden` eklendi |
| 13 | **Temiz makine simülasyonu** (`docker compose down -v` → `up -d --build`) | ✅ | Tüm Postgres volume'leri silinip sıfırdan ayağa kaldırıldı; **otomatik migration** sayesinde 7 konteynerin tamamı hatasız ayağa kalktı, ardından gerçek `register`/`login` isteği (`curl`) **ilk denemede** başarılı oldu — projenin başka bir makinede sıfırdan eksiksiz kurulabildiğinin kanıtı |
| 14 | `npm run build` (frontend) | ✅ | Her değişiklikten sonra tekrar tekrar çalıştırıldı, TypeScript hatasız derlendi |
| 15 | `dotnet build` (4 backend servisi ayrı ayrı) | ✅ | Her değişiklik sonrası tekrar tekrar çalıştırıldı; yalnızca önceden var olan 2 zararsız nullable uyarısı (RabbitMQ username/password) sürekli tekrar etti, hata yok |

**Test edilmedi / kapsam dışı bırakıldı** (zaman kısıtı nedeniyle): satış (sell) akışının uçtan uca tarayıcı testi (kod aynı `TradeCard` bileşenini kullandığı ve backend `SellCryptoCommandHandler`'ı da alım gibi test edildiği için düşük riskli varsayıldı, ama **tarayıcıda tıklanarak doğrulanmadı**), mobil görünümün yeni sayfalarda (Piyasalar/Varlıklarım/Al-Sat) test edilmesi (yalnızca Login/Register mobilde test edildi), çoklu kullanıcı/eşzamanlılık testi.

---

## 12. Bilinen Sınırlamalar / Yapılmayanlar

Bunların hiçbiri "unutuldu" değil — ya bilinçli kapsam dışı bırakıldı (bazıları önceki bir güvenlik denetiminde bulunup commit mesajında açıkça belgelendi) ya da zaman kısıtı nedeniyle henüz ele alınmadı.

### 12.1 Güvenlik / dayanıklılık

- **O1 — Alım/satım eşzamanlılık kontrolü yok**: `BuyCryptoCommandHandler`/`SellCryptoCommandHandler` içinde `PortfolioAccount.CashBalance` ve `Holding.Quantity` üzerinde optimistic/pessimistic concurrency (örn. EF Core `RowVersion`/`ConcurrencyToken`, veya DB seviyesinde transaction izolasyonu) **yoktur**. Aynı kullanıcı aynı anda iki alım isteği gönderirse (örn. çift tıklama, script), teorik olarak bakiyesinden fazlasını harcayabilir (race condition / double-spend riski). Önceki bir güvenlik denetiminde bulunmuş, bilinçli olarak kapsam dışı bırakılmıştır.
- **Y2 — Alt servisler Gateway'i bypass edilebilir**: `identity-api` (8081), `portfolio-api` (8082), `marketdata-api` (8083) portları host makinede **tüm arayüzlere** açıktır ve kendi üzerlerinde CORS/rate-limiting **yoktur**. Gateway'in sağladığı korumalar (CORS, 100 req/dk limit) `curl`/Postman ile doğrudan `localhost:8081` vb. adreslere gidilerek tamamen atlatılabilir. JWT doğrulaması (Identity hariç) hâlâ geçerlidir, yani veri sızıntısı riski yoktur ama DoS/rate-limit atlatma riski vardır.
- Backend'de **parola politikası yoktur** (min uzunluk, karmaşıklık) — yalnızca frontend'de kozmetik bir kontrol var.
- E-posta **doğrulanmaz** (format kontrolü de, "gerçek bir kutu mu" kontrolü de yok) ve **benzersizliği DB index'iyle zorlanmaz**, yalnızca uygulama kodunda kontrol edilir (yüksek eşzamanlılıkta teorik olarak aynı e-postayla iki kayıt yarışabilir).
- `UseHttpsRedirection()` her serviste çağrılır ama container'lar yalnızca `http://+:8080` dinler — pratikte hiçbir zaman devreye girmez (production'da TLS sonlandırma varsayılan olarak yoktur, bir reverse proxy/load balancer'ın önünde HTTPS sonlandırması yapılması gerekir).

### 12.2 Kimlik doğrulama / hesap yönetimi

- **Refresh token yok** — JWT süresi (60dk) dolunca kullanıcı otomatik yenilenmeden çıkışa düşer (frontend bunu proaktif yakalamaz, bir sonraki 401'de fark edilir).
- **Şifremi unuttum / şifre sıfırlama yok** — `LoginPage`'de link var ama işlevsiz (`href="/forgot-password"`, sayfa/endpoint mevcut değil).
- **E-posta doğrulama (email verification) yok.**
- **Hesap silme / profil düzenleme / para birimi değiştirme UI'si yok.**

### 12.3 Ürün özellikleri

- Yalnızca **piyasa emri** (anlık fiyattan al/sat) desteklenir — limit emir, stop-loss vb. yoktur.
- İşlem geçmişi sayfalanmaz (`limit` parametresi var ama frontend'de "daha fazla yükle" UI'si yok, sabit son 10-20 kayıt gösterilir).
- Çoklu para birimi yalnızca **kayıt sırasında görsel bir tercih**tir — tüm hesaplamalar/gösterimler gerçekte USD'dir (`formatUsd` her yerde sabit USD formatlar), gerçek bir döviz çevrimi **yoktur**.
- Fiyat grafiği yalnızca **24 saatlik** aralığı destekler (`days=1` sabit); 7g/30g/1y gibi seçenekler yoktur.
- Admin paneli / kullanıcı yönetimi yoktur.

### 12.4 Mühendislik / operasyon

- **Hiç otomatik test yoktur** (unit, integration, e2e) — tüm doğrulama elle, tarayıcı üzerinden yapıldı, kalıcı bir regresyon güvencesi yok.
- **CI/CD pipeline'ı yoktur** (GitHub Actions vb.) — her push sonrası build/test otomatik çalışmaz.
- Loglama yalnızca konsola (`docker logs`) yazılır; merkezi log toplama (Seq/ELK/Application Insights) yoktur.
- `Holdings.PortfolioId` ve `Transactions.PortfolioId` kolonlarında **index yoktur** — veri hacmi büyüdükçe sorgular yavaşlayabilir.
- MarketData önbelleği **process-içi** (`IMemoryCache`) — birden fazla MarketData instance'ı koşarsa (yatay ölçekleme) her biri kendi cache'ini tutar, tutarsızlık ve gereğinden fazla CoinGecko çağrısı olabilir (Redis gibi paylaşılan bir cache gerekir).
- CoinGecko **ücretsiz, API-key'siz** public endpoint kullanılıyor — resmi olmayan/garanti edilmeyen rate limit (deneyimlendiği üzere dakikada ~10-30 istekte `429` alınabiliyor). Prodüksiyon için ücretli bir CoinGecko planı veya farklı bir veri sağlayıcı gerekir.
- Docker build context'i tüm repo kökü (`context: .`) — her serviste gereksiz yere büyük/yavaş build ve zayıf layer cache kullanımı.

---

## 13. Yapılabilecekler (Yol Haritası)

Öncelik sırasına göre öneriler (kesin bir taahhüt değil, sonraki geliştirme adımları için başlangıç noktası):

**Kısa vadede (düşük efor, yüksek değer):**
1. `Holdings.PortfolioId` ve `Transactions.PortfolioId`'ye DB index'i ekle.
2. `Users.Email`'e unique index ekle (yarış durumunu DB seviyesinde de kapat).
3. Satış (sell) akışını ve mobil görünümü (Al-Sat/Piyasalar/Varlıklarım) tarayıcıda uçtan uca test et.
4. Transactions için "daha fazla yükle"/sayfalama UI'si ekle.

**Orta vadede:**
5. JWT refresh token akışı (örn. HttpOnly cookie'de saklanan uzun ömürlü refresh token + `/api/Auth/refresh`).
6. Şifremi unuttum akışı (e-posta ile sıfırlama linki — bir e-posta gönderim servisi gerektirir).
7. Alım/satımda optimistic concurrency (`RowVersion` / EF Core `[Timestamp]`) ile O1'i kapat.
8. Alt servisleri yalnızca Docker network'ü içinde erişilebilir yap (host'a port yayınlamayı kaldır, yalnızca Gateway host'a açık kalsın) — Y2'yi kapatır.
9. xUnit/NUnit ile en azından `BuyCryptoCommandHandler`/`SellCryptoCommandHandler`/`RegisterUserCommandHandler` için unit test; Testcontainers ile Portfolio API için integration test.
10. GitHub Actions ile build+lint+test pipeline'ı.

**Uzun vadede:**
11. Gerçek döviz çevrimi (`PreferredCurrency`'nin fiilen kullanılması) — bir döviz kuru servisi entegrasyonu.
12. WebSocket/SignalR ile canlı fiyat akışı (şu an her sayfa yenilemesinde/manuel sorguda tek seferlik REST çağrısı).
13. Farklı zaman aralıkları (7g/30g/1y) için grafik desteği.
14. Admin paneli, kullanıcı arama/yönetimi.
15. Redis tabanlı paylaşılan MarketData cache'i (yatay ölçekleme için).
16. Merkezi loglama/izleme (OpenTelemetry, Seq veya benzeri).
17. Limit emir / stop-loss gibi gelişmiş emir tipleri.

---

## 14. Proje Geçmişi (Commit Özeti)

En eskiden en yeniye (`git log --oneline`):

1. `9cf94e8` — **Faz 0-6**: Identity, Gateway, Portfolio, MarketData servislerinin ilk iskeleti ve Docker altyapısı.
2. `91723b2` — **Güvenlik**: gizli bilgiler `appsettings.Development.json`'a taşındı, RabbitMQ config'ten okunmaya başlandı.
3. `5ffe079` — **Docker altyapısı**: her serviste Dockerfile, `docker-compose.yml`, MassTransit `8.3.4`'e düşürüldü, Gateway'e MarketData route'u eklendi.
4. `99f7d79` — **Güvenlik**: Portfolio API'ye JWT doğrulama + sahiplik kontrolü (IDOR koruması).
5. `f49b7aa` — **Faz 8-9**: Portfolio alış/satış (buy/sell) mantığı ve tüm servislerde `/health` endpoint'i.
6. `2fcbe12` — **Güvenlik denetimi sonrası düzeltmeler**: auth hata kodları (401/400) düzeltildi, sembol girdisi normalize+doğrulanır oldu, Postgres/RabbitMQ portları `127.0.0.1`'e kısıtlandı. Denetimde bulunan O1 ve Y2 maddeleri bilinçli olarak kapsam dışı bırakılıp belgelendi (bkz. §12).
7. `9ef3090` — **Frontend ve API genişletmeleri**: `Finanshane.Web` frontend'in tamamı (login/register/dashboard/al-sat/piyasalar/varlıklarım), Portfolio'da Holdings+Transactions endpoint'leri ve migration'ı, MarketData'da çoklu-sembol/geçmiş/24s-değişim endpoint'leri + `IMemoryCache`, Gateway CORS, Identity+Portfolio'da otomatik EF Core migration, `.env.example`'lar ve kurulum README'si.

---

## 15. Dosya/Klasör Haritası

```
Mikroservice-Project/
├── .env.example                          # Docker-compose secrets şablonu (gerçek .env gitignore'da)
├── .gitignore
├── docker-compose.yml
├── FinanshaneProjesi.slnx                # (.vs/ altında saklanır, 14 proje)
├── README.md                             # bu dosya
│
├── Finanshane/                           # Identity API (Api katmanı)
│   ├── Controllers/AuthController.cs
│   ├── Dockerfile
│   ├── appsettings.json / appsettings.Development.json (gitignore'da)
│   └── Program.cs                        # JWT auth, otomatik migration
├── Finanshane.Domain/Entities/User.cs
├── Finanshane.Application/
│   ├── Commands/RegisterUserCommand(Handler).cs
│   ├── Queries/LoginQuery(Handler).cs
│   └── Interfaces/ITokenService.cs, IUserRepository.cs
├── Finanshane.Infrastructure/
│   ├── Persistence/IdentityDbContext.cs, UserRepository.cs, Migrations/
│   └── Security/TokenService.cs
│
├── Finanshane.Portfolio.Api/
│   ├── Controllers/PortfolioController.cs
│   ├── Dockerfile
│   └── Program.cs                        # JWT auth, MassTransit consumer, otomatik migration
├── Finanshane.Portfolio.Domain/Entities/PortfolioAccount.cs, Holding.cs, Transaction.cs
├── Finanshane.Portfolio.Application/
│   ├── Commands/Buy(Sell)CryptoCommand(Handler).cs
│   ├── Queries/GetPortfolioQuery(Handler).cs, GetHoldingsQuery(Handler).cs, GetTransactionsQuery(Handler).cs
│   ├── Consumer/UserRegisteredEventConsumer.cs
│   └── Interfaces/IPortfolioRepository.cs, IMarketDataClient.cs
├── Finanshane.Portfolio.Infrastructure/
│   ├── Persistence/PortfolioDbContext.cs, PortfolioRepository.cs, Migrations/
│   └── ExternalServices/MarketDataClient.cs
│
├── Finanshane.MarketData.Api/
│   ├── Controllers/MarketDataController.cs
│   ├── Dockerfile
│   └── Program.cs                        # IMemoryCache, no auth
├── Finanshane.MarketData.Domain/Models/CryptoPrice.cs
├── Finanshane.MarketData.Application/Interfaces/ICryptoPriceService.cs
├── Finanshane.MarketData.Infrastructure/ExternalApis/CoinGeckoService.cs
│
├── Finanshane.Gateaway/
│   ├── Dockerfile
│   ├── appsettings.json                  # YARP route/cluster config
│   └── Program.cs                        # CORS, rate limiting, reverse proxy
│
├── Finanshane.Contracts/UserRegisteredEvent.cs   # Identity↔Portfolio paylaşılan event
│
└── Finanshane.Web/                       # React frontend (bkz. §7)
    ├── .env.example
    ├── public/video/hero-bg.mp4
    └── src/ (App.tsx, components/, pages/, lib/)
```
