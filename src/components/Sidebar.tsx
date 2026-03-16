import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, Briefcase, Settings, Bell, Sparkles } from 'lucide-react';
import { useTheme } from '../theme/ThemeProvider';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Jobs', href: '/jobs', icon: Briefcase },
  { name: 'Companies', href: '/companies', icon: Building2 },
  { name: 'Filters', href: '/filters', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { themeDefinition } = useTheme();

  return (
    <aside className="app-sidebar flex h-screen flex-col">
      <div className="border-b border-white/10 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="brand-mark flex h-11 w-11 items-center justify-center rounded-2xl">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text-inverse)]">
              Job Ranger Alpha
            </h1>
            <p className="mt-1 text-sm text-white/70">{themeDefinition.story}</p>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-2">
          <span className="alpha-pill border-white/10 bg-white/5 text-white/75">
            <Sparkles className="h-3.5 w-3.5" />
            Alpha desktop
          </span>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-4 py-5">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`sidebar-link group flex items-center rounded-2xl px-3 py-3 text-sm font-semibold ${
                isActive ? 'sidebar-link-active' : ''
              }`}
            >
              <item.icon
                className="sidebar-link-icon mr-3 h-5 w-5 flex-shrink-0"
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 px-6 py-5 text-sm text-white/70">
        <p className="font-semibold text-white/90">Built for supportive review loops</p>
        <p className="mt-2 leading-6">
          Add a source, run a scrape, and tune filters without guessing what the app can or cannot do.
        </p>
      </div>
    </aside>
  );
}


