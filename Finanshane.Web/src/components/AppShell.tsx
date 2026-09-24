import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import Animate from '@/components/Animate';
import Logo from '@/components/Logo';
import { clearToken, getCurrentUser } from '@/lib/api';

const TABS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/trade', label: 'Al / Sat', end: false },
  { to: '/markets', label: 'Piyasalar', end: false },
  { to: '/holdings', label: 'Varlıklarım', end: false },
];

export default function AppShell() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  function handleLogout() {
    clearToken();
    navigate('/login', { replace: true });
  }

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden bg-[#080A19]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[60vw] h-[60vw] max-w-[900px] max-h-[900px] rounded-full bg-[radial-gradient(circle,rgba(56,80,190,0.28)_0%,rgba(8,10,25,0)_70%)]" />
        <div className="absolute -bottom-[25%] -left-[15%] w-[55vw] h-[55vw] max-w-[800px] max-h-[800px] rounded-full bg-[radial-gradient(circle,rgba(120,60,200,0.18)_0%,rgba(8,10,25,0)_70%)]" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      <div className="relative z-10">
        <nav className="w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px] pt-[20px] sm:pt-[30px] flex items-center justify-between">
          <Animate delay={0} direction="down">
            <div className="flex items-center gap-2.5">
              <Logo />
              <span className="text-white text-[22px] sm:text-[26px] font-[450] leading-none tracking-[-0.02em]">
                Finanshane
              </span>
            </div>
          </Animate>

          <Animate delay={150} direction="down">
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-white/50 text-[13px] font-[450]">
                {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="h-[42px] px-4 flex items-center gap-2 rounded-[11px] border border-white/15 text-white/80 text-[13px] font-[450] backdrop-blur-[17px] bg-[rgba(10,7,7,0.35)] transition-colors hover:bg-white/10 hover:text-white"
              >
                <LogOut className="w-[15px] h-[15px]" />
                Çıkış Yap
              </button>
            </div>
          </Animate>
        </nav>

        <Animate delay={200} direction="down">
          <div className="w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px] mt-6 sm:mt-8 mb-2">
            <div className="inline-flex items-center gap-1 p-[4px] rounded-[13px] bg-[rgba(10,7,7,0.35)] backdrop-blur-[17px] border border-white/[0.06] overflow-x-auto max-w-full">
              {TABS.map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.end}
                  className={({ isActive }) =>
                    `h-[40px] px-4 flex items-center justify-center whitespace-nowrap rounded-[10px] text-[13px] sm:text-[14px] font-[450] transition-colors ${
                      isActive
                        ? 'bg-white text-[#0A0707]'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  {tab.label}
                </NavLink>
              ))}
            </div>
          </div>
        </Animate>

        <main className="w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px] pt-4 pb-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
