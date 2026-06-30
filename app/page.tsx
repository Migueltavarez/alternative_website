'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Box, Layers, Zap, Shield, Users, TrendingUp,
  Clock, Headphones, Globe, ChevronRight, Loader2, Printer, DollarSign, Settings,
  X, Send
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { ContactForm } from '@/components/contact-form';
import { ScaleConverter } from '@/components/scale-converter';
import { PLANS } from '@/lib/stripe';

const features = [
  {
    icon: Box,
    title: 'Modelado 3D Profesional',
    description: 'Creamos modelos 3D detallados para arquitectura, productos, personajes y más.',
  },
  {
    icon: Layers,
    title: 'Rendering de Alta Calidad',
    description: 'Imágenes y animaciones fotorrealistas que impresionan a tus clientes.',
  },
  {
    icon: Zap,
    title: 'Entrega Rápida',
    description: 'Proyectos entregados en tiempo récord sin sacrificar calidad.',
  },
  {
    icon: Shield,
    title: 'Datos Seguros',
    description: 'Tu información y proyectos están protegidos con encriptación de grado militar.',
  },
];

const stats = [
  { value: '500+', label: 'Proyectos completados' },
  { value: '98%', label: 'Clientes satisfechos' },
  { value: '24h', label: 'Tiempo de respuesta' },
  { value: '50+', label: 'Países alcanzados' },
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

  const planNameToId: Record<string, string> = {
    'Básico': 'BASIC',
    'Pro': 'PRO',
    'Premium': 'PREMIUM',
  };

  const handleSubscribe = async (planName: string) => {
    const planId = planNameToId[planName] || planName;

    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/#pricing');
      return;
    }

    setLoadingPlan(planId);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al iniciar la suscripción');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <WhatsAppButton />

      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-50" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              <span className="gradient-text">Transformamos</span> tus ideas
              <br />
              en experiencias <span className="gradient-text">3D</span>
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
              Studio profesional de modelado, rendering y animación 3D. 
              Lleva tus proyectos al siguiente nivel con nuestra tecnología de vanguardia.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleCotiza}
                className="inline-flex items-center justify-center px-8 py-3 text-base font-medium bg-gradient-to-r from-[#2D6CB0] to-[#CC2631] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Cotiza ahora
                <ChevronRight className="ml-2 w-5 h-5" />
              </button>
              <Link
                href="/#pricing"
                className="inline-flex items-center justify-center px-8 py-3 text-base font-medium border border-input bg-background hover:bg-accent rounded-lg transition-colors"
              >
                Ver planes
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold gradient-text">{stat.value}</div>
                <div className="mt-2 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">¿Por qué elegirnos?</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Ofrecemos soluciones 3D de clase mundial con atención personalizada
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-xl glass hover:bg-accent/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#2D6CB0] to-[#CC2631] flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="py-20 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold">Servicios integrales</h2>
              <p className="mt-4 text-muted-foreground">
                Desde el concepto hasta la entrega final, manejamos cada detalle de tu proyecto 3D.
              </p>
              
              <div className="mt-8 space-y-4">
                {[
                  { icon: Box, title: 'Modelado 3D', desc: 'Productos, arquitectura, personajes' },
                  { icon: Layers, title: 'Rendering', desc: 'Fotorrealismo y estilo artístico' },
                  { icon: Users, title: 'Animación', desc: 'Personajes, productos, explicaciones' },
                  { icon: TrendingUp, title: 'Visualización', desc: 'Tour virtuales, AR/VR' },
                ].map((service, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <service.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{service.title}</h4>
                      <p className="text-sm text-muted-foreground">{service.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-blue-600/15 to-red-600/10 flex items-center justify-center">
                <div className="w-3/4 h-3/4 rounded-xl bg-gradient-to-br from-[#2D6CB0] to-[#CC2631] opacity-85 flex items-center justify-center">
                  <Box className="w-32 h-32 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ScaleConverter />

      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-500 font-semibold text-sm uppercase tracking-wider">Planes de Suscripción</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3">Elige tu plan de impresión 3D</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Sin contratos ni compromisos. Cancela cuando quieras. Todos los planes incluyen acceso completo a nuestra plataforma.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { 
                name: 'Básico', 
                price: '2,000', 
                credits: '300',
                color: 'emerald',
                features: ['300 créditos de impresión', '5% descuento en servicios', 'Acceso básico', 'Soporte por email'],
                highlighted: false,
                badge: null
              },
              { 
                name: 'Pro', 
                price: '5,000', 
                credits: '900',
                color: 'blue',
                features: ['900 créditos de impresión', 'Prioridad en producción', 'Soporte en diseño', '10% descuento en servicios'],
                highlighted: true,
                badge: '⭐ Más Popular'
              },
              { 
                name: 'Premium', 
                price: '8,000', 
                credits: '1800',
                color: 'gold',
                features: ['1800 créditos de impresión', 'Prioridad máxima', 'Diseño 3D incluido', '15% descuento en servicios'],
                highlighted: false,
                badge: null
              },
            ].map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-2xl ${
                  plan.highlighted 
                    ? plan.color === 'blue' 
                      ? 'bg-gradient-to-b from-blue-600/15 to-blue-500/5 border-2 border-blue-500/40 shadow-2xl shadow-blue-500/20' 
                      : plan.color === 'gold'
                        ? 'bg-gradient-to-b from-amber-600/15 to-amber-500/5 border border-amber-500/30'
                        : 'bg-gradient-to-b from-emerald-600/15 to-emerald-500/5 border border-emerald-500/30'
                    : 'bg-card border border-border hover:border-border/80'
                } p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className={`${plan.color === 'blue' ? 'bg-gradient-to-r from-blue-600 to-blue-500' : ''} text-white text-sm font-semibold px-4 py-1.5 rounded-full shadow-lg`}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4 mt-2">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    plan.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                    plan.color === 'blue' ? 'bg-blue-500/30 text-blue-300' :
                    'bg-amber-500/30 text-amber-300'
                  }`}>
                    {plan.color === 'emerald' ? '💎' : plan.color === 'blue' ? '⚡' : '👑'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{parseInt(plan.credits).toLocaleString()} créditos/mes</p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-bold">RD${plan.price}</span>
                    <span className="text-muted-foreground">/mes</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        plan.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                        plan.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        ✓
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.name)}
                  disabled={loadingPlan === plan.name.toUpperCase()}
                  className={`block text-center w-full py-4 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {loadingPlan === plan.name.toUpperCase() ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Procesando...
                    </span>
                  ) : (
                    'Suscribirme'
                  )}
                </button>

                {plan.highlighted && (
                  <p className="text-center text-xs text-muted-foreground mt-4">
                    ✓ Mejor relación calidad-precio
                  </p>
                )}
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground">
              ¿Necesitas más créditos? <Link href="/#contact" className="text-primary hover:underline">Contáctanos</Link> para un plan personalizado.
            </p>
          </div>
        </div>
      </section>

      {/* Makers CTA section */}
      <section id="makers" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass rounded-3xl overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-0">
              <div className="p-6 sm:p-10 lg:p-14">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                  <Printer className="w-4 h-4" />
                  Para dueños de impresoras 3D
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Pon tu máquina<br />
                  <span className="bg-gradient-to-r from-blue-400 to-red-400 bg-clip-text text-transparent">
                    a trabajar
                  </span>
                </h2>
                <p className="text-muted-foreground text-lg mb-8">
                  Regístrate como Maker y recibe trabajos de impresión 3D directamente
                  en tu cola. La plataforma asigna automáticamente los trabajos que tu
                  máquina puede cumplir.
                </p>
                <div className="space-y-3 mb-8">
                  {[
                    { icon: DollarSign, text: 'Recibe trabajos automáticamente según tu disponibilidad' },
                    { icon: Settings, text: 'Configura los colores, filamentos y nozzles de tu máquina' },
                    { icon: Clock, text: '10 minutos para aceptar cada trabajo asignado' },
                    { icon: Users, text: 'Carga distribuida equitativamente entre todos los makers' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground">{text}</p>
                    </div>
                  ))}
                </div>
                {['WORKER', 'DESIGNER', 'ADMIN'].includes((session?.user as any)?.role) ? (
                  <a
                    href="/worker"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2D6CB0] to-[#CC2631] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                  >
                    <Printer className="w-4 h-4" />
                    {(session?.user as any)?.role === 'DESIGNER' ? 'Ir a mi Panel de Diseño' : 'Ir a mi Panel de Maker'}
                  </a>
                ) : (
                  <Link
                    href={status === 'unauthenticated' ? '/login' : '/worker/register'}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2D6CB0] to-[#CC2631] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                  >
                    Registrarme como Maker
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
              <div className="bg-gradient-to-br from-blue-600/15 to-red-600/10 p-6 sm:p-10 lg:p-14 flex flex-col justify-center gap-6">
                {[
                  { label: 'Cola de impresión', value: 'Automática', sub: 'Asignación inteligente' },
                  { label: 'Tipos de filamento', value: '10+', sub: 'PLA, ABS, PETG, TPU...' },
                  { label: 'Timeout de aceptación', value: '10 min', sub: 'Se reasigna si no respondes' },
                ].map((item) => (
                  <div key={item.label} className="glass rounded-xl p-4">
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className="text-2xl font-bold mt-1">{item.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="py-20 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold">¿Tienes preguntas?</h2>
              <p className="mt-4 text-muted-foreground">
                Estamos aquí para ayudarte. Contáctanos y te responderemos lo antes posible.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Headphones className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Soporte 24/7</div>
                    <div className="text-sm text-muted-foreground">support@alternative3d.com</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Ubicación</div>
                    <div className="text-sm text-muted-foreground">República Dominicana</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Horario</div>
                    <div className="text-sm text-muted-foreground">Lun - Vie: 9:00 - 18:00</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-8">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {ctaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-6 w-full max-w-md relative"
          >
            <button
              onClick={() => setCtaOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-accent"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-1">Cotiza tu proyecto</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Completa los datos y crea tu cuenta para enviar tu solicitud.
            </p>
            <form onSubmit={handleCtaSubmit} className="space-y-3">
              <input
                required
                placeholder="Tu nombre"
                value={ctaForm.name}
                onChange={e => setCtaForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-sm outline-none focus:border-primary"
              />
              <input
                required
                type="email"
                placeholder="Tu email"
                value={ctaForm.email}
                onChange={e => setCtaForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-sm outline-none focus:border-primary"
              />
              <select
                required
                value={ctaForm.service}
                onChange={e => setCtaForm(f => ({ ...f, service: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-sm outline-none focus:border-primary"
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
                className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-sm outline-none focus:border-primary resize-none"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#2D6CB0] to-[#CC2631] text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Send className="w-4 h-4" />
                Crear cuenta y cotizar
              </button>
              <p className="text-center text-xs text-muted-foreground">
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => { setCtaOpen(false); router.push('/login?callbackUrl=/dashboard?tab=servicios'); }}
                  className="text-primary hover:underline"
                >
                  Inicia sesión
                </button>
              </p>
            </form>
          </motion.div>
        </div>
      )}

      <footer className="py-12 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2D6CB0] to-[#CC2631] flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <span className="font-bold">Alternative 3D Studio</span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
              <Link href="/legal/terminos" className="hover:text-foreground transition-colors">Términos y Condiciones</Link>
              <Link href="/legal/privacidad" className="hover:text-foreground transition-colors">Política de Privacidad</Link>
              <Link href="/legal/confidencialidad" className="hover:text-foreground transition-colors">Confidencialidad</Link>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 Alternative 3D Studio. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
