'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { CalendarDays, Clock, MapPin } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: string;
  imageUrl?: string;
}

export default function EventosPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/events')
      .then(r => r.json())
      .then(data => { setEvents(Array.isArray(data) ? data : []); })
      .finally(() => setLoading(false));
  }, []);

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

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {[1, 2].map(i => (
              <div key={i} className="glass rounded-2xl p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/4 mb-3" />
                <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-full mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <CalendarDays className="w-14 h-14 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h2 className="text-xl font-semibold mb-2">No hay eventos programados aún</h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Estamos organizando nuestra agenda de eventos. Mantente al tanto en nuestras redes sociales.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {events.map((event) => (
              <div key={event.id} className="glass rounded-2xl p-6 flex flex-col gap-4">
                {event.imageUrl && (
                  <img src={event.imageUrl} alt={event.title} className="w-full h-40 object-cover rounded-xl" />
                )}
                <div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">{event.type}</span>
                  <h3 className="text-lg font-bold mt-2">{event.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                </div>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 shrink-0" />
                    {formatDate(event.date)}
                  </div>
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
