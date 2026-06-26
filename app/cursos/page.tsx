'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/navbar';
import { Calendar, Play, Lock, CheckCircle2, Tag } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  videoUrl?: string;
  duration?: string;
  isFree: boolean;
  order: number;
}

interface CourseItem {
  id: string;
  title: string;
  description: string;
  price: number;
  isFree: boolean;
  isIntro: boolean;
  category?: string;
  thumbnailUrl?: string;
  lessons: Lesson[];
}

export default function CursosPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CourseItem | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/courses')
      .then(r => r.json())
      .then(data => { setCourses(Array.isArray(data) ? data : []); })
      .finally(() => setLoading(false));
  }, []);

  const handleEnroll = (course: CourseItem) => {
    if (!session) {
      router.push('/login?callbackUrl=/cursos');
      return;
    }
    if (!course.isFree && course.price > 0) {
      alert(`Para inscribirte en este curso (RD$${course.price.toLocaleString()}), contacta con soporte o adquiere el plan correspondiente.`);
      return;
    }
    setSelected(course);
    setActiveLesson(course.lessons.find(l => l.isFree || course.isFree) ?? course.lessons[0] ?? null);
  };

  const canWatch = (lesson: Lesson, course: CourseItem) =>
    course.isFree || lesson.isFree || !!session;

  if (selected) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-20 px-4 max-w-5xl mx-auto">
          <button
            onClick={() => { setSelected(null); setActiveLesson(null); }}
            className="text-sm text-primary hover:underline mb-6 flex items-center gap-1"
          >
            ← Volver a cursos
          </button>
          <div className="grid md:grid-cols-[1fr_300px] gap-6">
            <div>
              {activeLesson?.videoUrl ? (
                <div className="rounded-2xl overflow-hidden bg-black aspect-video">
                  <iframe
                    src={activeLesson.videoUrl}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              ) : (
                <div className="rounded-2xl bg-card border border-border aspect-video flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">Sin video disponible</p>
                </div>
              )}
              <div className="mt-4">
                <h1 className="text-2xl font-bold">{selected.title}</h1>
                {activeLesson && (
                  <p className="text-muted-foreground mt-1">{activeLesson.title}</p>
                )}
              </div>
            </div>

            <div className="glass rounded-2xl p-4 h-fit">
              <h3 className="font-semibold mb-3">Lecciones</h3>
              <div className="space-y-1">
                {selected.lessons.map((lesson) => {
                  const canView = canWatch(lesson, selected);
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => canView && setActiveLesson(lesson)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                        activeLesson?.id === lesson.id
                          ? 'bg-primary/20 text-primary'
                          : canView
                          ? 'hover:bg-accent'
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {canView ? (
                        <Play className="w-4 h-4 shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 shrink-0" />
                      )}
                      <span className="flex-1">{lesson.title}</span>
                      {lesson.duration && (
                        <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                      )}
                      {lesson.isFree && (
                        <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 rounded">Gratis</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-20 px-4 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold gradient-text mb-3">Cursos</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Aprende fabricación digital, diseño 3D y maquetería con nuestros instructores especializados.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass rounded-2xl p-6 animate-pulse">
                <div className="h-32 bg-muted rounded-xl mb-4" />
                <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <Calendar className="w-14 h-14 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h2 className="text-xl font-semibold mb-2">No hay cursos disponibles aún</h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Estamos preparando el contenido. Síguenos en redes sociales para enterarte primero.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div key={course.id} className="glass rounded-2xl overflow-hidden flex flex-col">
                {course.thumbnailUrl ? (
                  <img src={course.thumbnailUrl} alt={course.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-primary/20 to-destructive/20 flex items-center justify-center">
                    <Play className="w-12 h-12 text-primary/40" />
                  </div>
                )}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {course.isIntro && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium">Intro</span>
                    )}
                    {course.isFree ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">Gratis</span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">
                        RD${course.price.toLocaleString()}
                      </span>
                    )}
                    {course.category && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium flex items-center gap-1">
                        <Tag className="w-3 h-3" />{course.category}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold mb-1">{course.title}</h3>
                  <p className="text-sm text-muted-foreground flex-1 mb-3 line-clamp-3">{course.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <span>{course.lessons.length} lecciones</span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-400" />
                      {course.lessons.filter(l => l.isFree).length} gratis
                    </span>
                  </div>
                  <button
                    onClick={() => handleEnroll(course)}
                    className="w-full py-2 rounded-lg bg-gradient-to-r from-primary to-destructive text-white text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    {course.isFree ? 'Ver curso' : 'Inscribirme'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
