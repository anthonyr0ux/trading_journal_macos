import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calculator, BookOpen, Upload, Settings, HelpCircle } from 'lucide-react';
import nemesisLogo from '../assets/nemesis-logo.jpg';

export default function Layout() {
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const navigation = [
    { name: t('nav.dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { name: t('nav.calculator'), path: '/calculator', icon: Calculator },
    { name: t('nav.journal'), path: '/journal', icon: BookOpen },
    { name: t('nav.import'), path: '/import', icon: Upload },
    { name: t('nav.settings'), path: '/settings', icon: Settings },
    { name: t('nav.help'), path: '/help', icon: HelpCircle },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <img
              src={nemesisLogo}
              alt="Nemesis Logo"
              className="w-12 h-12 object-contain"
            />
            <h1 className="text-2xl font-bold text-foreground leading-tight">
              Nemesis
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {i18n.language === 'fr' ? 'Journal de Trading' : 'Trading Journal'}
          </p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
