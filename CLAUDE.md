# Instrucciones para Claude Code

## 📖 Contexto histórico — leer al iniciar

Al comenzar cada sesión, lee los siguientes archivos en orden para tener contexto completo del proyecto:

1. `C:\Users\Miguel\Documents\Obsidian Vault\index.md` — índice general, estado actual y proyectos activos
2. `C:\Users\Miguel\Documents\Obsidian Vault\Projects\Alt3dstudio\Proyecto - Alternative 3D Studio.md` — overview técnico
3. `C:\Users\Miguel\Documents\Obsidian Vault\Projects\Alt3dstudio\Roadmap.md` — qué está hecho y qué falta

Lee los demás archivos del vault solo si la tarea lo requiere:
- `Projects/Alt3dstudio/Sistema de Makers.md` — para tareas relacionadas con la cola o los makers
- `Projects/Alt3dstudio/Base de Datos.md` — para cambios de schema o migraciones
- `Projects/Alt3dstudio/APIs.md` — para tareas de endpoints

---

## 📝 Reglas de trabajo

### Obsidian — actualizar siempre
Después de cada cambio significativo al proyecto, actualiza los archivos del vault:
- `Roadmap.md` → marcar completado o agregar pendientes
- `Base de Datos.md` → si cambia el schema de Prisma
- `APIs.md` → si se agregan o modifican endpoints
- `index.md` → actualizar el bloque "Estado actual" con las últimas funciones

### Git — dos repositorios
- **Proyecto**: `C:\Users\Miguel\Desktop\Alternative Web V2` → `https://github.com/Migueltavarez/alternative_website.git`
- **Vault Obsidian**: `C:\Users\Miguel\Documents\Obsidian Vault` → `https://github.com/Migueltavarez/obsidian-brain.git`

El usuario pedirá explícitamente cuándo hacer commit/push.

### Prisma en Windows
- Usar `npx prisma db push` (no `migrate dev` — requiere input interactivo)
- `npx prisma generate` falla si el servidor de Next.js está corriendo (DLL bloqueado)
- Detener el servidor con Ctrl+C antes de regenerar

### Preferencias generales
- Respuestas cortas y directas
- Sin comentarios innecesarios en el código
- Sin emojis salvo que se pida explícitamente
- Español para comunicación con el usuario
- Confirmar antes de acciones destructivas o que afecten sistemas compartidos

---

## 🔧 Stack del proyecto actual

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14 (App Router) |
| Base de datos | SQLite (Prisma ORM 5.x) |
| Autenticación | NextAuth.js v4 (JWT, 30 días) |
| Pagos | Stripe + PayPal |
| UI | Tailwind CSS + Framer Motion |
| Idioma UI | Español (es-DO) |
| Moneda | DOP (RD$) + USD |
