'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Box, Layers, Zap, Users, Clock, Headphones, Globe,
  ChevronRight, Loader2, Printer, DollarSign, Settings,
  X, Send, Building2, Building, Star, MapPin, Mail,
  Award, Truck, Ruler, Cpu, Package, TrendingUp,
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { ContactForm } from '@/components/contact-form';
import { ScaleConverter } from '@/components/scale-converter';

const services = [
  { icon: Cpu,       title: 'Impresión 3D',           desc: 'Piezas funcionales, prototipos y repuestos.' },
  { icon: Ruler,     title: 'Diseño 3D',              desc: 'Modelado personalizado para tus proyectos.' },
  { icon: Building2, title: 'Maquetas',               desc: 'Arquitectónicas, industriales y de interiores.' },
  { icon: Package,   title: 'Producción bajo demanda', desc: 'Series pequeñas y producción personalizada.' },
  { icon: Truck,     title: 'Envíos a todo el país',   desc: 'Recibe tus productos en cualquier lugar.' },
];

const galleryItems = [
  { icon: Building2, label: 'Maquetas Arquitectónicas', gradient: 'from-blue-950 to-slate-900' },
  { icon: Building,  label: 'Maquetas de Edificios',    gradient: 'from-slate-800 to-gray-900' },
  { icon: Printer,   label: 'Impresión de Prototipos',  gradient: 'from-orange-950 to-amber-900' },
  { icon: Settings,  label: 'Piezas Industriales',      gradient: 'from-zinc-800 to-zinc-950' },
  { icon: Star,      label: 'Figuras Personalizadas',   gradient: 'from-purple-950 to-indigo-900' },
];

const whyUs = [
  { icon: Award,    title: 'Calidad Premium',        desc: 'Materiales y equipos de alta gama.' },
  { icon: Users,    title: 'Atención Personalizada', desc: 'Te acompañamos en todo el proceso.' },
  { icon: Zap,      title: 'Experiencia',            desc: 'Años de experiencia en impresión 3D.' },
  { icon: Cpu,      title: 'Innovación',             desc: 'Siempre a la vanguardia de la tecnología.' },
];

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [ctaOpen, setCtaOpen] = useState(false);
  const [ctaForm, setCtaForm] = useState({ name: '', email: '', service: '', description: '' });

  const handleCotiza = () => {
    if (session) {
      router.push('/dashboard?tab=servicios');
    } else {
      setCtaOpen(true);
    }
  };

  const handleCtaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/register?name=${encodeURIComponent(ctaForm.name)}&email=${encodeURIComponent(ctaForm.email)}&from=cta`);
  };

  const handleSubscribe = async (planName: string) => {
    const planNameToId: Record<string, string> = { 'Básico': 'BASIC', 'Pro': 'PRO', 'Premium': 'PREMIUM' };
    const planId = planNameToId[planName] || planName;
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

      {/* ── Top info bar ── */}
      <div className="hidden md:block bg-zinc-900 border-b border-zinc-800 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-xs text-zinc-400">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3" /> Santo Domingo, República Dominicana
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="w-3 h-3" /> info@alt3dstudio.com
            </span>
          </div>
          <div className="flex items-center gap-5 text-zinc-400">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-lime-500 transition-colors">Instagram</a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-lime-500 transition-colors">Facebook</a>
            <a href="https://wa.me/18295551234" target="_blank" rel="noopener noreferrer" className="hover:text-lime-500 transition-colors">WhatsApp</a>
          </div>
        </div>
      </div>

      <Navbar />
      <WhatsAppButton />

      {/* ── HERO ── */}
      <section className="relative pt-16 min-h-[88vh] flex items-center overflow-hidden bg-zinc-950">
        {/* Right image panels (visual treatment) */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 grid grid-cols-3">
            <div className="col-span-1" />
            <div className="col-span-1 bg-gradient-to-b from-slate-700/50 to-slate-900/80 flex items-center justify-center">
              <Building2 className="w-28 h-28 text-white/10" />
            </div>
            <div className="col-span-1 grid grid-rows-2">
              <div className="bg-gradient-to-b from-zinc-600/40 to-zinc-900/80 flex items-center justify-center">
                <Printer className="w-16 h-16 text-white/10" />
              </div>
              <div className="bg-gradient-to-b from-neutral-700/30 to-neutral-900/80 flex items-center justify-center">
                <Package className="w-16 h-16 text-white/10" />
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-zinc-950/20" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-7xl font-black uppercase leading-none tracking-tight">
              DAMOS VIDA<br />
              A TUS <span className="text-lime-500">IDEAS</span>
            </h1>
            <p className="mt-6 text-lg text-zinc-400 max-w-lg">
              Impresión 3D de alta calidad para proyectos, prototipos y producción.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCotiza}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-lime-500 hover:bg-lime-600 text-black font-bold uppercase text-sm tracking-wide transition-colors"
              >
                Solicitar Cotización <ChevronRight className="w-4 h-4" />
              </button>
              <Link
                href="#services"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/20 text-white font-bold uppercase text-sm tracking-wide hover:bg-white/10 transition-colors"
              >
                Ver Servicios
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES STRIP ── */}
      <section id="services" className="bg-zinc-900 border-y border-zinc-800 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {services.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-start gap-2">
                <Icon className="w-8 h-8 text-lime-500" />
                <h3 className="font-bold text-sm uppercase tracking-wide text-white">{title}</h3>
                <p className="text-xs text-zinc-400 leading-snug">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALLERY ── */}
      <section className="bg-neutral-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <div className="w-8 h-1 bg-lime-500 mb-3" />
              <h2 className="text-2xl md:text-3xl font-black uppercase text-black">Galería de Proyectos</h2>
            </div>
            <Link href="/store" className="text-sm font-bold uppercase tracking-wide text-black hover:text-lime-600 flex items-center gap-1 transition-colors">
              Ver más proyectos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {galleryItems.map(({ icon: Icon, label, gradient }) => (
              <div key={label} className="group cursor-pointer">
                <div className={`aspect-[4/5] bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
                  <Icon className="w-16 h-16 text-white/20 group-hover:text-lime-400/40 group-hover:scale-110 transition-all duration-300" />
                </div>
                <p className="mt-2 text-xs text-black/60 font-medium text-center">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY US ── */}
      <section className="bg-zinc-950 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-8 h-1 bg-lime-500 mb-4" />
              <h2 className="text-3xl md:text-4xl font-black uppercase leading-tight">
                ¿POR QUÉ ELEGIR{' '}
                <span className="text-lime-500">ALT 3D STUDIO?</span>
              </h2>
              <p className="mt-4 text-zinc-400 max-w-md">
                Nos enfocamos en calidad, precisión y buen servicio. Usamos tecnología de última generación y
                materiales de alto rendimiento para garantizar los mejores resultados.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-6">
                {whyUs.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3">
                    <div className="p-2 rounded bg-lime-500/10 shrink-0">
                      <Icon className="w-5 h-5 text-lime-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm uppercase tracking-wide text-white">{title}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="aspect-video bg-zinc-900 rounded grid grid-cols-3 grid-rows-2 gap-2 p-4">
              {[Printer, Settings, Box, Layers, Cpu, Award].map((Icon, i) => (
                <div key={i} className="bg-zinc-800/60 rounded flex items-center justify-center">
                  <Icon className="w-8 h-8 text-zinc-600" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SCALE CONVERTER ── */}
      <div className="bg-zinc-900">
        <ScaleConverter />
      </div>

      {/* ── PLANS ── */}
      <section id="pricing" className="py-20 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="w-8 h-1 bg-lime-500 mx-auto mb-4" />
            <span className="text-lime-500 font-bold text-sm uppercase tracking-wider">Planes de Suscripción</span>
            <h2 className="text-3xl md:text-4xl font-black uppercase mt-3">Elige tu plan de impresión 3D</h2>
            <p className="mt-4 text-zinc-400 max-w-2xl mx-auto">
              Sin contratos ni compromisos. Cancela cuando quieras.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                name: 'Básico', price: '2,000', credits: '300',
                features: ['300 créditos de impresión', '5% descuento en servicios', 'Acceso básico', 'Soporte por email'],
                highlighted: false, badge: null,
              },
              {
                name: 'Pro', price: '5,000', credits: '900',
                features: ['900 créditos de impresión', 'Prioridad en producción', 'Soporte en diseño', '10% descuento en servicios'],
                highlighted: true, badge: 'Más Popular',
              },
              {
                name: 'Premium', price: '8,000', credits: '1800',
                features: ['1800 créditos de impresión', 'Prioridad máxima', 'Diseño 3D incluido', '15% descuento en servicios'],
                highlighted: false, badge: null,
              },
            ].map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded bg-zinc-900 border transition-all duration-300 hover:scale-[1.02] p-6 ${
                  plan.highlighted ? 'border-lime-500/60 shadow-xl shadow-lime-500/10' : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-lime-500 text-black text-xs font-bold px-4 py-1.5 uppercase tracking-wide">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mt-2 mb-4">
                  <h3 className="text-xl font-black uppercase">{plan.name}</h3>
                  <p className="text-sm text-zinc-400">{parseInt(plan.credits).toLocaleString()} créditos/mes</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black">RD${plan.price}</span>
                    <span className="text-zinc-400 text-sm">/mes</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="text-lime-500 font-bold shrink-0">✓</span>
                      <span className="text-zinc-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.name)}
                  disabled={loadingPlan === plan.name.toUpperCase()}
                  className={`w-full py-4 font-bold uppercase text-sm tracking-wide transition-all disabled:opacity-50 ${
                    plan.highlighted
                      ? 'bg-lime-500 hover:bg-lime-600 text-black'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  }`}
                >
                  {loadingPlan === plan.name.toUpperCase() ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Procesando...
                    </span>
                  ) : 'Suscribirme'}
                </button>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-zinc-400 text-sm">
              ¿Necesitas más créditos?{' '}
              <Link href="#contact" className="text-lime-500 hover:text-lime-400 hover:underline">Contáctanos</Link>
              {' '}para un plan personalizado.
            </p>
          </div>
        </div>
      </section>

      {/* ── MAKERS CTA ── */}
      <section id="makers" className="py-20 bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border border-zinc-800 rounded overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-0">
              <div className="p-10 lg:p-14">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-lime-500/10 border border-lime-500/20 text-lime-500 text-xs font-bold uppercase tracking-wide mb-6">
                  <Printer className="w-4 h-4" /> Para dueños de impresoras 3D
                </div>
                <h2 className="text-3xl md:text-4xl font-black uppercase mb-4">
                  Pon tu máquina<br />
                  <span className="text-lime-500">a trabajar</span>
                </h2>
                <p className="text-zinc-400 text-lg mb-8">
                  Regístrate como Maker y recibe trabajos de impresión 3D directamente en tu cola.
                </p>
                <div className="space-y-3 mb-8">
                  {[
                    { icon: DollarSign, text: 'Recibe trabajos automáticamente según tu disponibilidad' },
                    { icon: Settings,   text: 'Configura colores, filamentos y nozzles de tu máquina' },
                    { icon: Clock,      text: '10 minutos para aceptar cada trabajo asignado' },
                    { icon: Users,      text: 'Carga distribuida equitativamente entre todos los makers' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-lime-500/10 rounded flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-lime-500" />
                      </div>
                      <p className="text-sm text-zinc-400">{text}</p>
                    </div>
                  ))}
                </div>
                {['WORKER', 'DESIGNER', 'ADMIN'].includes((session?.user as any)?.role) ? (
                  <a
                    href="/worker"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-lime-500 hover:bg-lime-600 text-black font-bold uppercase text-sm tracking-wide transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    {(session?.user as any)?.role === 'DESIGNER' ? 'Ir a mi Panel de Diseño' : 'Ir a mi Panel de Maker'}
                  </a>
                ) : (
                  <Link
                    href={status === 'unauthenticated' ? '/login' : '/worker/register'}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-lime-500 hover:bg-lime-600 text-black font-bold uppercase text-sm tracking-wide transition-colors"
                  >
                    Registrarme como Maker <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
              <div className="bg-zinc-800/40 p-10 lg:p-14 flex flex-col justify-center gap-6">
                {[
                  { label: 'Cola de impresión',       value: 'Automática',  sub: 'Asignación inteligente' },
                  { label: 'Tipos de filamento',      value: '10+',         sub: 'PLA, ABS, PETG, TPU...' },
                  { label: 'Timeout de aceptación',   value: '10 min',      sub: 'Se reasigna si no respondes' },
                ].map((item) => (
                  <div key={item.label} className="bg-zinc-900 border border-zinc-800 rounded p-4">
                    <p className="text-xs text-zinc-400 uppercase tracking-wide">{item.label}</p>
                    <p className="text-2xl font-black text-lime-500 mt-1">{item.value}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="py-20 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <div className="w-8 h-1 bg-lime-500 mb-4" />
              <h2 className="text-3xl md:text-4xl font-black uppercase">¿Tienes preguntas?</h2>
              <p className="mt-4 text-zinc-400">Estamos aquí para ayudarte. Contáctanos y te respondemos lo antes posible.</p>
              <div className="mt-8 space-y-4">
                {[
                  { icon: Headphones, label: 'Soporte',    value: 'info@alt3dstudio.com' },
                  { icon: Globe,      label: 'Ubicación',  value: 'Santo Domingo, República Dominicana' },
                  { icon: Clock,      label: 'Horario',    value: 'Lun - Vie: 9:00 - 18:00' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-lime-500/10 rounded flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-lime-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm uppercase tracking-wide">{label}</p>
                      <p className="text-sm text-zinc-400">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded p-8">
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
              className="inline-flex items-center gap-2 px-8 py-3 bg-black text-white font-bold uppercase text-sm tracking-wide hover:bg-zinc-900 transition-colors"
            >
              <Printer className="w-4 h-4" /> Solicitar Cotización
            </button>
            <div className="flex flex-col sm:flex-row items-center gap-4 text-black font-medium text-sm">
              <a href="https://wa.me/18295551234" className="flex items-center gap-2 hover:opacity-80">
                📱 (829) 555-1234
              </a>
              <span className="flex items-center gap-2">
                ✉️ info@alt3dstudio.com
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-zinc-900 border-t border-zinc-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Alternative 3D Studio"
                className="h-8 w-auto"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <span className="font-bold text-white">Alternative 3D Studio</span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-zinc-400">
              <Link href="/legal/terminos" className="hover:text-white transition-colors">Términos y Condiciones</Link>
              <Link href="/legal/privacidad" className="hover:text-white transition-colors">Política de Privacidad</Link>
              <Link href="/legal/confidencialidad" className="hover:text-white transition-colors">Confidencialidad</Link>
            </div>
            <p className="text-sm text-zinc-500">© 2025 Alternative 3D Studio. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* ── CTA MODAL ── */}
      {ctaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded p-6 w-full max-w-md relative"
          >
            <button onClick={() => setCtaOpen(false)} className="absolute top-4 right-4 p-1 rounded hover:bg-zinc-800">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-black uppercase mb-1">Cotiza tu proyecto</h2>
            <p className="text-sm text-zinc-400 mb-5">
              Completa los datos y crea tu cuenta para enviar tu solicitud.
            </p>
            <form onSubmit={handleCtaSubmit} className="space-y-3">
              <input
                required
                placeholder="Tu nombre"
                value={ctaForm.name}
                onChange={e => setCtaForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-2.5 rounded bg-zinc-800 border border-zinc-700 text-white text-sm outline-none focus:border-lime-500 placeholder:text-zinc-500"
              />
              <input
                required type="email"
                placeholder="Tu email"
                value={ctaForm.email}
                onChange={e => setCtaForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-2.5 rounded bg-zinc-800 border border-zinc-700 text-white text-sm outline-none focus:border-lime-500 placeholder:text-zinc-500"
              />
              <select
                required
                value={ctaForm.service}
                onChange={e => setCtaForm(f => ({ ...f, service: e.target.value }))}
                className="w-full px-4 py-2.5 rounded bg-zinc-800 border border-zinc-700 text-white text-sm outline-none focus:border-lime-500"
              >
                <option value="">Selecciona un servicio</option>
                <option value="print_3d">Impresión 3D (FDM)</option>
                <option value="resin">Impresión en Resina</option>
                <option value="laser">Corte / Grabado Láser</option>
                <option value="design">Diseño 3D</option>
              </select>
              <textarea
                placeholder="Describe brevemente tu proyecto (opcional)"
                value={ctaForm.description}
                onChange={e => setCtaForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2.5 rounded bg-zinc-800 border border-zinc-700 text-white text-sm outline-none focus:border-lime-500 resize-none placeholder:text-zinc-500"
              />
              <button
                type="submit"
                className="w-full py-3 bg-lime-500 hover:bg-lime-600 text-black font-bold uppercase text-sm tracking-wide flex items-center justify-center gap-2 transition-colors"
              >
                <Send className="w-4 h-4" /> Crear cuenta y cotizar
              </button>
              <p className="text-center text-xs text-zinc-400">
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => { setCtaOpen(false); router.push('/login?callbackUrl=/dashboard?tab=servicios'); }}
                  className="text-lime-500 hover:underline"
                >
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
