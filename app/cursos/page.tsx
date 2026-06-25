import { Navbar } from '@/components/navbar';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';

const upcomingCourses: {
  title: string;
  description: string;
  date: string;
  duration: string;
  location: string;
  spots: number;
  tag: string;
}[] = [];

export default function CursosPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-20 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold gradient-text mb-3">Próximos Cursos</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Aprende fabricación digital, diseño 3D y maquetería con nuestros instructores especializados.
          </p>
        </div>

        {upcomingCourses.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <Calendar className="w-14 h-14 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h2 className="text-xl font-semibold mb-2">No hay cursos programados aún</h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Estamos preparando nuestra agenda de cursos. Síguenos en redes sociales para enterarte primero.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {upcomingCourses.map((course, i) => (
              <div key={i} className="glass rounded-2xl p-6 flex flex-col gap-4">
                <div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">{course.tag}</span>
                  <h3 className="text-lg font-bold mt-2">{course.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{course.description}</p>
                </div>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4 shrink-0" />{course.date}</div>
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4 shrink-0" />{course.duration}</div>
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4 shrink-0" />{course.location}</div>
                  <div className="flex items-center gap-2"><Users className="w-4 h-4 shrink-0" />{course.spots} cupos disponibles</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
