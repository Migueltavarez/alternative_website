'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, Sun, Moon, User, LogOut, LayoutDashboard, Shield,
  ChevronDown, MessageSquare, Printer, ShoppingBag, UserCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from './store/cart-context';
import { NotificationBell } from './notification-bell';

function ChatBell({ isAdmin }: { isAdmin: boolean }) {
  const { data: session } = useSession();
  const [unread, setUnread] = useState(0);
  const prevUnread = useRef(0);

  const fetchUnread = async () => {
    if (!session?.user) return;
    try {
      if (isAdmin) {
        const res = await fetch('/api/admin/chat');
        if (res.ok) {
          const data = await res.json();
          const total = Array.isArray(data)
            ? data.reduce((sum: number, c: any) => sum + (c.unreadCount ?? 0), 0)
            : 0;
          if (total > prevUnread.current && prevUnread.current >= 0) {
            try {
              const ctx = new AudioContext();
              const o = ctx.createOscillator();
              const g = ctx.createGain();
              o.connect(g); g.connect(ctx.destination);
              o.frequency.value = 660;
              g.gain.setValueAtTime(0.3, ctx.currentTime);
              g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
              o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.4);
            } catch {}
          }
          prevUnread.current = total;
          setUnread(total);
        }
      } else {
        const res = await fetch('/api/chat');
        if (res.ok) {
          const data = await res.json();
          const msgs = Array.isArray(data) ? data : (data.messages ?? []);
          const count = msgs.filter((m: any) => m.sender === 'ADMIN' && !m.readByUser).length;
          setUnread(count);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchUnread();
    const iv = setInterval(fetchUnread, 10_000);
    return () => clearInterval(iv);
  }, [session, isAdmin]);

  if (!session?.user) return null;

  const href = isAdmin ? '/admin?tab=mensajes' : '/dashboard?tab=soporte';

  return (
    <Link href={href} className="relative p-2 rounded-lg hover:bg-accent transition-colors" aria-label="Mensajes">
      <MessageSquare className="w-5 h-5" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center text-[10px] font-bold bg-green-500 text-white rounded-full">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  );
}

const navigation = [
  { name: 'Inicio', href: '/' },
  { name: 'Precios', href: '/#pricing' },
  { name: 'Servicios', href: '/#services' },
  { name: 'Makers', href: '/#makers' },
  { name: 'Tienda', href: '/store' },
  { name: 'Cursos', href: '/cursos' },
  { name: 'Eventos', href: '/eventos' },
  { name: 'Contacto', href: '/#contact' },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const { cartCount, setCartOpen } = useCart();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const user = session?.user as any;
  const isAdmin = user?.role === 'ADMIN';
  const isDesigner = user?.role === 'DESIGNER';
  const isSeller = user?.role === 'SELLER';
  const isWorker = user?.role === 'WORKER' || user?.role === 'ADMIN' || isDesigner;
  const workerPanelLabel = isDesigner ? 'Panel de Diseño' : 'Panel Maker';

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'glass shadow-lg' : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="Alternative 3D Studio"
                className="h-10 w-auto"
                onError={(e) => {
                  const img = e.currentTarget;
                  img.style.display = 'none';
                  const fallback = img.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#2D6CB0] to-[#CC2631] items-center justify-center hidden">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="font-bold text-xl hidden sm:block">Alternative 3D</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary',
                    pathname === item.href ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <ChatBell isAdmin={isAdmin} />
            {/* Cart button */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 rounded-lg hover:bg-accent transition-colors"
              aria-label="Carrito"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center text-[10px] font-bold bg-gradient-to-br from-[#2D6CB0] to-[#CC2631] text-white rounded-full">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="relative p-2 rounded-lg hover:bg-accent transition-colors"
              aria-label="Toggle theme"
            >
              <Sun className="w-5 h-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute top-2 left-2 w-5 h-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button>

            {isSeller && (
              <a
                href="/seller"
                className="hidden md:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-[#2D6CB0] to-[#CC2631] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <UserCircle className="w-4 h-4" />
                Panel Vendedor
              </a>
            )}

            {isWorker && (
              <a
                href="/worker"
                className="hidden md:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-[#2D6CB0] to-[#CC2631] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <Printer className="w-4 h-4" />
                {workerPanelLabel}
              </a>
            )}

            {session ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2D6CB0] to-[#CC2631] flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-48 rounded-lg glass shadow-xl py-1"
                    >
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <UserCircle className="w-4 h-4" />
                        Mi Perfil
                      </Link>
                      {!isAdmin && (
                        <Link
                          href="/dashboard?tab=soporte"
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <MessageSquare className="w-4 h-4" />
                          Soporte
                        </Link>
                      )}
                      {isSeller && (
                        <Link
                          href="/seller"
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <UserCircle className="w-4 h-4" />
                          Panel Vendedor
                        </Link>
                      )}
                      {isWorker && (
                        <Link
                          href="/worker"
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <Printer className="w-4 h-4" />
                          {workerPanelLabel}
                        </Link>
                      )}
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <Shield className="w-4 h-4" />
                          Admin
                        </Link>
                      )}
                      <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors text-red-500"
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar sesión
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-lg transition-colors"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-[#2D6CB0] to-[#CC2631] text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  Registrarse
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-accent"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t"
          >
            <div className="px-4 py-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-4 py-2 rounded-lg hover:bg-accent transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {!session && (
                <div className="pt-2 space-y-2">
                  <Link
                    href="/login"
                    className="block px-4 py-2 text-center rounded-lg hover:bg-accent transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/register"
                    className="block px-4 py-2 text-center bg-gradient-to-r from-[#2D6CB0] to-[#CC2631] text-white rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
