'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ChevronRight, Loader2, Printer, DollarSign, Settings,
  X, Send, Building2, MapPin, Mail, Award, Truck,
  Ruler, Cpu, Package, Users, Zap, Clock, Headphones, Globe,
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { ContactForm } from '@/components/contact-form';
import { ScaleConverter } from '@/components/scale-converter';

/* ─── Image collections ──────────────────────────────────────────────────── */

const U = (id: string, w = 800, h = 600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

const HERO_IMAGES = [
  { src: U('photo-1633356122544-f134324a6cee', 900, 700), alt: 'Impresora 3D profesional' },
  { src: U('photo-1612815154858-60aa4c59eaa6', 900, 350), alt: 'Impresión 3D en proceso' },
  { src: U('photo-1486325212027-8081e485255e', 900, 350), alt: 'Maqueta arquitectónica' },
];

const MAQUETAS = [
  { src: U('photo-1486325212027-8081e485255e', 600, 500), label: 'Edificio residencial' },
  { src: U('photo-1524758631624-e2822e304c36', 600, 500), label: 'Torres modernas' },
  { src: U('photo-1545324418-cc1a3fa10c00', 600, 500), label: 'Conjunto habitacional' },
  { src: U('photo-1564013799919-ab600027ffc6', 600, 500), label: 'Arquitectura de lujo' },
  { src: U('photo-1486312338219-ce68d2c6f44d', 600, 500), label: 'Planimetría 3D' },
];

const PRINTING = [
  { src: U('photo-1633356122544-f134324a6cee', 600, 500), label: 'Impresora FDM' },
  { src: U('photo-1612815154858-60aa4c59eaa6', 600, 500), label: 'Capa a capa' },
  { src: U('photo-1558618666-fcd25c85cd64', 600, 500), label: 'Resultado final' },
  { src: U('photo-1581092160607-ee22621dd758', 600, 500), label: 'Taller en producción' },
  { src: U('photo-1611532736597-de2d4265fba3', 600, 500), label: 'Alta precisión' },
];

const INDUSTRIALES = [
  { src: U('photo-1518770660439-4636190af475', 600, 500), label: 'Engranajes' },
  { src: U('photo-1581093450021-4a7360e9a6b5', 600, 500), label: 'Pieza mecánica' },
  { src: U('photo-1565126709348-7e4c63b77b01', 600, 500), label: 'Componente técnico' },
  { src: U('photo-1537462715879-360eeb61a0ad', 600, 500), label: 'Prototipo funcional' },
];

const FIGURAS = [
  { src: U('photo-1558618666-fcd25c85cd64', 600, 500), label: 'Figura coleccionable' },
  { src: U('photo-1563089145-599997674d42', 600, 500), label: 'Personaje 3D' },
  { src: U('photo-1599597307673-5c7a3b5efa27', 600, 500), label: 'Estatuilla' },
  { src: U('photo-1519638399535-1b036603ac77', 600, 500), label: 'Impresión artística' },
];

const DECORACION = [
  { src: U('photo-1484101403633-562f891dc89a', 600, 500), label: 'Florero moderno' },
  { src: U('photo-1615529182904-14819c35db37', 600, 500), label: 'Cerámica impresa' },
  { src: U('photo-1600585154340-be6161a56a0c', 600, 500), label: 'Decoración hogar' },
  { src: U('photo-1555041469-a586c61ea9bc', 600, 500), label: 'Piezas decorativas' },
];

const FILAMENTOS = [
  { src: U('photo-1586769852836-bc069f19e1b6', 600, 500), label: 'PLA multicolor' },
  { src: U('photo-1513151233558-d860c5398176', 600, 500), label: 'Bobinas PETG' },
  { src: U('photo-1558618047-f4884da4b4c2', 600, 500), label: 'Filamento ABS' },
];

const SERVICES = [
  { icon: Cpu,       title: 'Impresión 3D',           desc: 'Piezas funcionales, prototipos y repuestos.' },
  { icon: Ruler,     title: 'Diseño 3D',              desc: 'Modelado personalizado para tus proyectos.' },
  { icon: Building2, title: 'Maquetas',               desc: 'Arquitectónicas, industriales y de interiores.' },
  { icon: Package,   title: 'Producción bajo demanda', desc: 'Series pequeñas y producción personalizada.' },
  { icon: Truck,     title: 'Envíos a todo el país',   desc: 'Recibe tus productos en cualquier lugar.' },
];

const WHY_US = [
  { icon: Award,     title: 'Calidad Premium',        desc: 'Materiales y equipos de alta gama.' },
  { icon: Users,     title: 'Atención Personalizada', desc: 'Te acompañamos en todo el proceso.' },
  { icon: Zap,       title: 'Tecnología Avanzada',    desc: 'Siempre a la vanguardia de la tecnología.' },
  { icon: Truck,     title: 'Envíos a todo el país',   desc: 'Recibe tus productos donde estés.' },
  { icon: Clock,     title: 'Entrega Rápida',         desc: 'Opciones Express y Urgente disponibles.' },
];

/* ─── Gallery row component ─────────────────────────────────────────────── */

function GalleryRow({
  title, items, light = false,
}: {
  title: string;
  items: { src: string; label: string }[];
  light?: boolean;
}) {
  return (
    <section className={light ? 'bg-neutral-100 py-12' : 'bg-zinc-900 py-12'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="w-8 h-1 bg-lime-500 mb-2" />
            <h2 className={`text-xl md:text-2xl font-black uppercase ${light ? 'text-black' : 'text-white'}`}>{title}</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {items.map(({ src, label }) => (
            <div key={label} className="group relative overflow-hidden aspect-[4/5]">
              <img
                src={src}
                alt={label}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement;
                  el.style.display = 'none';
                  const parent = el.parentElement;
                  if (parent) {
                    parent.style.background = 'linear-gradient(135deg,#1a1a2e,#16213e)';
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <p className="absolute bottom-0 left-0 right-0 px-3 py-2 text-xs text-white font-medium translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [ctaOpen, setCtaOpen] = useState(false);
  const [ctaForm, setCtaForm] = useState({ name: '', email: '', service: '', description: '' });

  const handleCotiza = () => {
    if (session) router.push('/dashboard?tab=servicios');
    else setCtaOpen(true);
  };

  const handleCtaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/register?name=${encodeURIComponent(ctaForm.name)}&email=${encodeURIComponent(ctaForm.email)}&from=cta`);
  };

  const handleSubscribe = async (planName: string) => {
    const map: Record<string, string> = { 'Básico': 'BASIC', 'Pro': 'PRO', 'Premium': 'PREMIUM' };
    const planId = map[planName] || planName;
    if (status === 'unauthenticated') { router.push('/login?callbackUrl=/#pricing'); return; }
    setLoadingPlan(planId);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else if (data.error) alert(data.error);
    } catch { alert('Error al iniciar la suscripción'); }
    finally { setLoadingPlan(null); }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {/* ── Top bar ── */}
      <div className="hidden md:block bg-zinc-900 border-b border-zinc-800 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-xs text-zinc-400">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Santo Domingo, República Dominicana</span>
            <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> info@alt3dstudio.com</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-lime-500 transition-colors">Instagram</a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-lime-500 transition-colors">Facebook</a>
            <a href="https://wa.me/18295551234" target="_blank" rel="noopener noreferrer" className="hover:text-lime-500 transition-colors">WhatsApp</a>
          </div>
        </div>
      </div>

      <Navbar />
      <WhatsAppButton />

      {/* ── HERO ── */}
      <section className="relative pt-16 overflow-hidden bg-black">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] min-h-[88vh]">
          {/* Text side */}
          <div className="relative z-10 flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-20 bg-gradient-to-r from-black via-black to-black/80">
            <h1 className="text-5xl md:text-6xl xl:text-7xl font-black uppercase leading-none tracking-tight">
              DAMOS VIDA<br />
              A TUS <span className="text-lime-500">IDEAS</span>
            </h1>
            <p className="mt-6 text-base md:text-lg text-zinc-400 max-w-sm">
              Impresión 3D de alta calidad para proyectos, prototipos y producción.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCotiza}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-lime-500 hover:bg-lime-600 text-black font-black uppercase text-sm tracking-widest transition-colors"
              >
                Solicitar Cotización <ChevronRight className="w-4 h-4" />
              </button>
              <Link
                href="#gallery"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/20 text-white font-bold uppercase text-sm tracking-wide hover:bg-white/10 transition-colors"
              >
                Ver Servicios
              </Link>
            </div>
          </div>

          {/* Images side */}
          <div className="grid grid-rows-2 grid-cols-2 gap-1">
            <div className="col-span-2 row-span-1 relative overflow-hidden">
              <img
                src={HERO_IMAGES[0].src}
                alt={HERO_IMAGES[0].alt}
                className="w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-black/30" />
            </div>
            <div className="relative overflow-hidden">
              <img
                src={HERO_IMAGES[1].src}
                alt={HERO_IMAGES[1].alt}
                className="w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-black/40" />
            </div>
            <div className="relative overflow-hidden">
              <img
                src={HERO_IMAGES[2].src}
                alt={HERO_IMAGES[2].alt}
                className="w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-black/40" />
              {/* Brand overlay on last hero panel */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 p-4">
                <img src="/logo.png" alt="Alt 3D Studio" className="h-12 w-auto mb-3 object-contain"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                <p className="text-white font-black text-sm uppercase tracking-widest text-center">
                  DAMOS VIDA<br />A TUS <span className="text-lime-500">IDEAS</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES STRIP ── */}
      <section id="services" className="bg-zinc-900 border-y border-zinc-800 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {SERVICES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-start gap-2">
                <Icon className="w-8 h-8 text-lime-500" />
                <h3 className="font-black text-sm uppercase tracking-wide">{title}</h3>
                <p className="text-xs text-zinc-400 leading-snug">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALLERIES ── */}
      <div id="gallery">
        <GalleryRow title="Maquetas Arquitectónicas" items={MAQUETAS} light />
        <GalleryRow title="Impresión 3D en Proceso" items={PRINTING} />
        <GalleryRow title="Prototipos Industriales" items={INDUSTRIALES} light />
        <GalleryRow title="Figuras y Coleccionables" items={FIGURAS} />
        <GalleryRow title="Decoración y Hogar" items={DECORACION} light />
      </div>

      {/* ── MATERIALES + TALLER (2 col split) ── */}
      <section className="bg-zinc-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Filamentos */}
            <div>
              <div className="w-8 h-1 bg-lime-500 mb-2" />
              <h2 className="text-xl font-black uppercase text-white mb-4">Materiales / Filamentos</h2>
              <div className="grid grid-cols-3 gap-2">
                {FILAMENTOS.map(({ src, label }) => (
                  <div key={label} className="group relative aspect-square overflow-hidden">
                    <img src={src} alt={label} loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    <div className="absolute inset-0 bg-black/40" />
                    <p className="absolute bottom-1 left-2 text-[10px] text-white font-medium">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Taller */}
            <div>
              <div className="w-8 h-1 bg-lime-500 mb-2" />
              <h2 className="text-xl font-black uppercase text-white mb-4">Taller y Equipo</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { src: U('photo-1581092160607-ee22621dd758', 600, 400), label: 'Sala de impresión' },
                  { src: U('photo-1633356122544-f134324a6cee', 600, 400), label: 'Equipo Bambu Lab' },
                ].map(({ src, label }) => (
                  <div key={label} className="group relative aspect-video overflow-hidden">
                    <img src={src} alt={label} loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    <div className="absolute inset-0 bg-black/40" />
                    <p className="absolute bottom-1 left-2 text-[10px] text-white font-medium">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY US + BENEFITS ── */}
      <section className="bg-zinc-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left text */}
            <div>
              <div className="w-8 h-1 bg-lime-500 mb-4" />
              <h2 className="text-3xl md:text-4xl font-black uppercase leading-tight">
                ¿POR QUÉ ELEGIR <span className="text-lime-500">ALT 3D STUDIO?</span>
              </h2>
              <p className="mt-4 text-zinc-400 max-w-md">
                Nos enfocamos en calidad, precisión y buen servicio. Usamos tecnología de última generación y
                materiales de alto rendimiento para garantizar los mejores resultados.
              </p>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {WHY_US.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3">
                    <div className="p-2 rounded bg-lime-500/10 shrink-0">
                      <Icon className="w-5 h-5 text-lime-500" />
                    </div>
                    <div>
                      <p className="font-black text-sm uppercase tracking-wide">{title}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleCotiza}
                className="mt-10 inline-flex items-center gap-2 px-8 py-4 bg-lime-500 hover:bg-lime-600 text-black font-black uppercase text-sm tracking-widest transition-colors"
              >
                Solicitar Cotización <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Right — stacked images */}
            <div className="grid grid-cols-2 gap-2 h-80 lg:h-[420px]">
              <div className="row-span-2 relative overflow-hidden">
                <img src={U('photo-1612815154858-60aa4c59eaa6', 500, 800)} alt="Impresión 3D"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <div className="relative overflow-hidden">
                <img src={U('photo-1545324418-cc1a3fa10c00', 500, 400)} alt="Maqueta"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <div className="relative overflow-hidden">
                <img src={U('photo-1518770660439-4636190af475', 500, 400)} alt="Piezas"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SCALE CONVERTER ── */}
      <div className="bg-zinc-950">
        <ScaleConverter />
      </div>

      {/* ── PLANS ── */}
      <section id="pricing" className="py-20 bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="w-8 h-1 bg-lime-500 mx-auto mb-4" />
            <span className="text-lime-500 font-bold text-sm uppercase tracking-wider">Planes de Suscripción</span>
            <h2 className="text-3xl md:text-4xl font-black uppercase mt-3">Elige tu plan de impresión 3D</h2>
            <p className="mt-3 text-zinc-400 max-w-xl mx-auto text-sm">Sin contratos ni compromisos. Cancela cuando quieras.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: 'Básico',  price: '2,000', credits: '300',  features: ['300 créditos de impresión', '5% descuento en servicios', 'Acceso básico', 'Soporte por email'], hi: false, badge: null },
              { name: 'Pro',     price: '5,000', credits: '900',  features: ['900 créditos de impresión', 'Prioridad en producción', 'Soporte en diseño', '10% descuento'], hi: true,  badge: 'Más Popular' },
              { name: 'Premium', price: '8,000', credits: '1800', features: ['1800 créditos de impresión', 'Prioridad máxima', 'Diseño 3D incluido', '15% descuento'], hi: false, badge: null },
            ].map((plan, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className={`relative rounded bg-zinc-950 border p-6 transition-all duration-300 hover:scale-[1.02] ${plan.hi ? 'border-lime-500/60 shadow-xl shadow-lime-500/10' : 'border-zinc-800 hover:border-zinc-700'}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-lime-500 text-black text-xs font-black px-4 py-1 uppercase tracking-wide">{plan.badge}</span>
                  </div>
                )}
                <h3 className="text-xl font-black uppercase mt-2">{plan.name}</h3>
                <p className="text-xs text-zinc-400">{parseInt(plan.credits).toLocaleString()} créditos/mes</p>
                <div className="my-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black">RD${plan.price}</span>
                  <span className="text-zinc-400 text-sm">/mes</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2 text-sm">
                      <span className="text-lime-500 font-bold shrink-0">✓</span>
                      <span className="text-zinc-300">{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe(plan.name)}
                  disabled={loadingPlan === plan.name.toUpperCase()}
                  className={`w-full py-3 font-black uppercase text-sm tracking-wide transition-all disabled:opacity-50 ${plan.hi ? 'bg-lime-500 hover:bg-lime-600 text-black' : 'bg-zinc-800 hover:bg-zinc-700 text-white'}`}
                >
                  {loadingPlan === plan.name.toUpperCase()
                    ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</span>
                    : 'Suscribirme'}
                </button>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-zinc-400 text-sm mt-10">
            ¿Necesitas más créditos?{' '}
            <Link href="#contact" className="text-lime-500 hover:underline">Contáctanos</Link> para un plan personalizado.
          </p>
        </div>
      </section>

      {/* ── MAKERS CTA ── */}
      <section id="makers" className="py-16 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border border-zinc-800 overflow-hidden grid lg:grid-cols-2">
            <div className="p-10 lg:p-14">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-lime-500/10 border border-lime-500/20 text-lime-500 text-xs font-black uppercase tracking-wide mb-6">
                <Printer className="w-4 h-4" /> Para dueños de impresoras 3D
              </div>
              <h2 className="text-3xl font-black uppercase mb-4">
                Pon tu máquina<br /><span className="text-lime-500">a trabajar</span>
              </h2>
              <p className="text-zinc-400 mb-8">Regístrate como Maker y recibe trabajos automáticamente según tu disponibilidad.</p>
              <div className="space-y-3 mb-8">
                {[
                  { icon: DollarSign, text: 'Recibe trabajos automáticamente según tu disponibilidad' },
                  { icon: Settings,   text: 'Configura colores, filamentos y nozzles de tu máquina' },
                  { icon: Clock,      text: '10 minutos para aceptar cada trabajo asignado' },
                  { icon: Users,      text: 'Carga distribuida equitativamente entre makers' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-lime-500/10 rounded flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-lime-500" /></div>
                    <p className="text-sm text-zinc-400">{text}</p>
                  </div>
                ))}
              </div>
              {['WORKER', 'DESIGNER', 'ADMIN'].includes((session?.user as any)?.role) ? (
                <a href="/worker" className="inline-flex items-center gap-2 px-6 py-3 bg-lime-500 hover:bg-lime-600 text-black font-black uppercase text-sm transition-colors">
                  <Printer className="w-4 h-4" />
                  {(session?.user as any)?.role === 'DESIGNER' ? 'Ir a mi Panel de Diseño' : 'Ir a mi Panel de Maker'}
                </a>
              ) : (
                <Link href={status === 'unauthenticated' ? '/login' : '/worker/register'}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-lime-500 hover:bg-lime-600 text-black font-black uppercase text-sm transition-colors">
                  Registrarme como Maker <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
            <div className="bg-zinc-900 p-10 lg:p-14 flex flex-col justify-center gap-4">
              {[
                { label: 'Cola de impresión',     value: 'Automática', sub: 'Asignación inteligente' },
                { label: 'Tipos de filamento',    value: '10+',        sub: 'PLA, ABS, PETG, TPU...' },
                { label: 'Timeout de aceptación', value: '10 min',     sub: 'Se reasigna si no respondes' },
              ].map((item) => (
                <div key={item.label} className="bg-zinc-950 border border-zinc-800 p-4 rounded">
                  <p className="text-xs text-zinc-400 uppercase tracking-wide">{item.label}</p>
                  <p className="text-2xl font-black text-lime-500 mt-1">{item.value}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="py-16 bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <div className="w-8 h-1 bg-lime-500 mb-4" />
              <h2 className="text-3xl font-black uppercase">¿Tienes preguntas?</h2>
              <p className="mt-3 text-zinc-400">Estamos aquí para ayudarte. Contáctanos y te respondemos lo antes posible.</p>
              <div className="mt-8 space-y-4">
                {[
                  { icon: Headphones, label: 'Email',     value: 'info@alt3dstudio.com' },
                  { icon: Globe,      label: 'Ubicación', value: 'Santo Domingo, República Dominicana' },
                  { icon: Clock,      label: 'Horario',   value: 'Lun - Vie: 9:00 - 18:00' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-lime-500/10 rounded flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-lime-500" />
                    </div>
                    <div>
                      <p className="font-black text-sm uppercase tracking-wide">{label}</p>
                      <p className="text-sm text-zinc-400">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded p-8">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── GREEN CTA BAR ── */}
      <section className="bg-lime-500 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-black text-xl uppercase text-black">¿Tienes un proyecto en mente?</p>
            <p className="text-black/70 text-sm mt-1">Cuéntanos tu idea y la hacemos realidad.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <button
              onClick={handleCotiza}
              className="inline-flex items-center gap-2 px-8 py-3 bg-black hover:bg-zinc-900 text-white font-black uppercase text-sm tracking-widest transition-colors"
            >
              <Printer className="w-4 h-4" /> Solicitar Cotización
            </button>
            <div className="flex flex-col sm:flex-row items-center gap-4 text-black font-medium text-sm">
              <a href="https://wa.me/18295551234" className="flex items-center gap-2 hover:opacity-80">📱 (829) 555-1234</a>
              <span className="flex items-center gap-2">✉️ info@alt3dstudio.com</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-zinc-900 border-t border-zinc-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Alternative 3D Studio" className="h-8 w-auto"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            <span className="font-black text-white">Alternative 3D Studio</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-zinc-400">
            <Link href="/legal/terminos" className="hover:text-white transition-colors">Términos y Condiciones</Link>
            <Link href="/legal/privacidad" className="hover:text-white transition-colors">Política de Privacidad</Link>
            <Link href="/legal/confidencialidad" className="hover:text-white transition-colors">Confidencialidad</Link>
          </div>
          <p className="text-sm text-zinc-500">© 2025 Alternative 3D Studio. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* ── CTA MODAL ── */}
      {ctaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded p-6 w-full max-w-md relative">
            <button onClick={() => setCtaOpen(false)} className="absolute top-4 right-4 p-1 rounded hover:bg-zinc-800">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-black uppercase mb-1">Cotiza tu proyecto</h2>
            <p className="text-sm text-zinc-400 mb-5">Completa los datos y crea tu cuenta para enviar tu solicitud.</p>
            <form onSubmit={handleCtaSubmit} className="space-y-3">
              <input required placeholder="Tu nombre" value={ctaForm.name}
                onChange={e => setCtaForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-2.5 rounded bg-zinc-800 border border-zinc-700 text-white text-sm outline-none focus:border-lime-500 placeholder:text-zinc-500" />
              <input required type="email" placeholder="Tu email" value={ctaForm.email}
                onChange={e => setCtaForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-2.5 rounded bg-zinc-800 border border-zinc-700 text-white text-sm outline-none focus:border-lime-500 placeholder:text-zinc-500" />
              <select required value={ctaForm.service}
                onChange={e => setCtaForm(f => ({ ...f, service: e.target.value }))}
                className="w-full px-4 py-2.5 rounded bg-zinc-800 border border-zinc-700 text-white text-sm outline-none focus:border-lime-500">
                <option value="">Selecciona un servicio</option>
                <option value="print_3d">Impresión 3D (FDM)</option>
                <option value="resin">Impresión en Resina</option>
                <option value="laser">Corte / Grabado Láser</option>
                <option value="design">Diseño 3D</option>
              </select>
              <textarea placeholder="Describe brevemente tu proyecto (opcional)" value={ctaForm.description}
                onChange={e => setCtaForm(f => ({ ...f, description: e.target.value }))} rows={3}
                className="w-full px-4 py-2.5 rounded bg-zinc-800 border border-zinc-700 text-white text-sm outline-none focus:border-lime-500 resize-none placeholder:text-zinc-500" />
              <button type="submit"
                className="w-full py-3 bg-lime-500 hover:bg-lime-600 text-black font-black uppercase text-sm tracking-wide flex items-center justify-center gap-2 transition-colors">
                <Send className="w-4 h-4" /> Crear cuenta y cotizar
              </button>
              <p className="text-center text-xs text-zinc-400">
                ¿Ya tienes cuenta?{' '}
                <button type="button"
                  onClick={() => { setCtaOpen(false); router.push('/login?callbackUrl=/dashboard?tab=servicios'); }}
                  className="text-lime-500 hover:underline">
                  Inicia sesión
                </button>
              </p>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
