import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import { ApiError, login, saveToken } from '@/lib/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { token } = await login({ email, password });
      saveToken(token);
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Sunucuya ulaşılamadı. Lütfen tekrar deneyin.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      leftHeading="Yatırımlarınızı zirveye taşıyın"
      leftSubtext="Gerçek zamanlı piyasa verileri ve güvenli altyapıyla kripto portföyünüzü tek ekrandan yönetin."
      navAction={{ label: 'Hesap oluştur', href: '/register' }}
    >
      <div className="w-full rounded-[24px] sm:rounded-[28px] bg-[rgba(17,16,15,0.55)] backdrop-blur-[24px] border border-white/[0.08] p-6 sm:p-9">
        <p className="text-white/50 text-[13px] font-[450] leading-[16px] mb-2 uppercase tracking-[0.06em]">
          Giriş Yap
        </p>
        <h2 className="text-white text-[26px] sm:text-[30px] font-[450] leading-[1.1] mb-7 sm:mb-8">
          Tekrar hoş geldiniz
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-white/70 text-[13px] font-[450] mb-2">
              E-posta
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@finanshane.com"
              className="w-full h-[50px] px-4 rounded-[12px] bg-white/[0.05] border border-white/10 text-white text-[15px] placeholder:text-white/30 outline-none transition-colors focus:border-white/40 focus:bg-white/[0.07]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-white/70 text-[13px] font-[450]">
                Şifre
              </label>
              <a
                href="/forgot-password"
                className="text-white/40 text-[12px] font-[450] hover:text-white/70 transition-colors"
              >
                Şifremi unuttum
              </a>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-[50px] px-4 pr-11 rounded-[12px] bg-white/[0.05] border border-white/10 text-white text-[15px] placeholder:text-white/30 outline-none transition-colors focus:border-white/40 focus:bg-white/[0.07]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-[18px] h-[18px]" />
                ) : (
                  <Eye className="w-[18px] h-[18px]" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-[10px] bg-red-500/10 border border-red-500/30 text-red-300 text-[13px] font-[450] leading-[18px]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 h-[51px] w-full flex items-center justify-center gap-2 bg-[#E9E9E9] rounded-[12px] text-[#0A0707] text-[15.5px] font-[450] leading-[15.5px] transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 className="w-[16px] h-[16px] animate-spin" />}
            {isSubmitting ? 'Giriş yapılıyor…' : 'Giriş Yap'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-white/30 text-[12px] font-[450]">veya</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <p className="text-center text-white/50 text-[14px] font-[450]">
          Hesabınız yok mu?{' '}
          <a href="/register" className="text-white hover:text-white/70 transition-colors">
            Kayıt olun
          </a>
        </p>
      </div>
    </AuthLayout>
  );
}
