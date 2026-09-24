const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (options.auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && 'message' in data && String(data.message)) ||
      'Bir hata oluştu. Lütfen tekrar deneyin.';
    throw new ApiError(message, response.status);
  }

  return data as T;
}

// ---- Auth ----

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export function login(payload: LoginRequest) {
  return request<LoginResponse>('/api/Auth/login', { method: 'POST', body: payload });
}

export interface RegisterRequest {
  email: string;
  password: string;
  preferredCurrency: string;
}

export interface RegisterResponse {
  userId: string;
}

export function register(payload: RegisterRequest) {
  return request<RegisterResponse>('/api/Auth/register', { method: 'POST', body: payload });
}

// ---- Portfolio ----

export interface PortfolioAccount {
  id: string;
  userId: string;
  cashBalance: number;
  currency: string;
  createdAt: string;
}

export function getPortfolio(userId: string) {
  return request<PortfolioAccount>(`/api/Portfolio/${userId}`, { auth: true });
}

/**
 * Right after registration the portfolio account is created asynchronously
 * (via a RabbitMQ event), so the first GET can 404 for a brief moment.
 * Retries a few times before giving up.
 */
export async function getPortfolioWithRetry(
  userId: string,
  attempts = 5,
  delayMs = 700,
): Promise<PortfolioAccount> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await getPortfolio(userId);
    } catch (err) {
      const isLastAttempt = i === attempts - 1;
      if (err instanceof ApiError && err.status === 404 && !isLastAttempt) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw err;
    }
  }
  throw new ApiError('Portföy yüklenemedi.', 404);
}

export interface Holding {
  id: string;
  portfolioId: string;
  symbol: string;
  quantity: number;
}

export function getHoldings(userId: string) {
  return request<Holding[]>(`/api/Portfolio/${userId}/holdings`, { auth: true });
}

export interface BuyRequest {
  symbol: string;
  amountUsd: number;
}

export interface BuyResult {
  symbol: string;
  quantity: number;
  pricePerUnit: number;
  remainingCashBalance: number;
}

export function buyCrypto(userId: string, payload: BuyRequest) {
  return request<BuyResult>(`/api/Portfolio/${userId}/buy`, {
    method: 'POST',
    body: payload,
    auth: true,
  });
}

export interface SellRequest {
  symbol: string;
  quantity: number;
}

export interface SellResult {
  symbol: string;
  quantity: number;
  pricePerUnit: number;
  receivedUsd: number;
  newCashBalance: number;
}

export function sellCrypto(userId: string, payload: SellRequest) {
  return request<SellResult>(`/api/Portfolio/${userId}/sell`, {
    method: 'POST',
    body: payload,
    auth: true,
  });
}

export type TransactionType = 'Buy' | 'Sell' | 0 | 1;

export interface Transaction {
  id: string;
  portfolioId: string;
  type: TransactionType;
  symbol: string;
  quantity: number;
  pricePerUnit: number;
  totalUsd: number;
  createdAt: string;
}

export function isBuyTransaction(t: Transaction) {
  return t.type === 0 || t.type === 'Buy';
}

export function getTransactions(userId: string, limit = 20) {
  return request<Transaction[]>(`/api/Portfolio/${userId}/transactions?limit=${limit}`, {
    auth: true,
  });
}

// ---- Market data ----

export interface CryptoPrice {
  symbol: string;
  priceUsd: number;
  change24h: number | null;
}

export interface PricePoint {
  timestampMs: number;
  priceUsd: number;
}

export function getCryptoPrice(symbol: string) {
  return request<CryptoPrice>(`/api/MarketData/crypto/${symbol.toLowerCase()}`);
}

export function getCryptoPrices(symbols: string[]) {
  const query = symbols.map((s) => s.toLowerCase()).join(',');
  return request<CryptoPrice[]>(`/api/MarketData/crypto?symbols=${encodeURIComponent(query)}`);
}

export function getCryptoPriceHistory(symbol: string, days = 1) {
  return request<PricePoint[]>(`/api/MarketData/crypto/${symbol.toLowerCase()}/history?days=${days}`);
}

export function getSupportedSymbols() {
  return request<string[]>('/api/MarketData/symbols');
}

// ---- Token storage & decoding ----

const TOKEN_KEY = 'finanshane_token';

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export interface TokenClaims {
  sub: string;
  email: string;
  pereferredCurrency?: string;
  exp: number;
}

export function decodeToken(token: string): TokenClaims | null {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(json) as TokenClaims;
  } catch {
    return null;
  }
}

export function getCurrentUser(): TokenClaims | null {
  const token = getToken();
  if (!token) return null;
  const claims = decodeToken(token);
  if (!claims) return null;
  if (claims.exp * 1000 < Date.now()) {
    clearToken();
    return null;
  }
  return claims;
}
