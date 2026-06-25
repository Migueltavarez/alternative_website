import { Navbar } from '@/components/navbar';
import { CalendarDays, Clock, MapPin, Tag } from 'lucide-react';

const upcomingEvents: {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: string;
}[] = [];

export default function EventosPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-20 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold gradient-text mb-3">Próximos Eventos</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Ferias, exhibiciones, talleres y encuentros de la comunidad maker en República Dominicana.
          </p>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <CalendarDays className="w-14 h-14 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h2 className="text-xl font-semibold mb-2">No hay eventos programados aún</h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Estamos organizando nuestra agenda de eventos. Mantente al tanto en nuestras redes sociales.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {upcomingEvents.map((event, i) => (
              <div key={i} className="glass rounded-2xl p-6 flex flex-col gap-4">
                <div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 font-medium">{event.type}</span>
                  <h3 className="text-lg font-bold mt-2">{event.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                </div>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><CalendarDays className="w-4 h-4 shrink-0" />{event.date}</div>
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4 shrink-0" />{event.time}</div>
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4 shrink-0" />{event.location}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
