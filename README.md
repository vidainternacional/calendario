# Vida Internacional — App de Servidores y Ministerios

Aplicación web progresiva (PWA) para la gestión interna de la iglesia **Vida Internacional**.

> ⚠️ **Nota:** El nombre del repositorio es `calendario` por razones históricas, pero este proyecto **no es** el Calendario Vida original. Esta es una aplicación nueva y completa de gestión de ministerios, servidores, eventos, publicaciones, solicitudes e intercambios de turnos.

---

## Módulos

| Módulo | Ruta | Descripción |
|---|---|---|
| Inicio | `/inicio` | Dashboard personalizado por rol |
| Calendario | `/calendario` | Eventos del ministerio |
| Avisos | `/avisos` | Publicaciones internas |
| Solicitudes | `/solicitudes` | Peticiones de permisos |
| Intercambios | `/intercambios` | Cambios de turno entre servidores |
| Perfil | `/perfil` | Datos personales del servidor |
| Admin | `/admin` | Panel de administración (pastor/admin) |

## Roles

- **Pastor / Administrador** — Acceso total
- **Líder de Ministerio** — Gestión de su ministerio
- **Servidor** — Vista propia y solicitudes

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Lenguaje:** TypeScript estricto
- **Estilos:** Tailwind CSS
- **Base de datos:** Supabase (PostgreSQL + RLS)
- **Auth:** Supabase Auth
- **PWA:** Service Worker + Web App Manifest
- **Deploy:** Vercel

## Variables de entorno

Copia `.env.local.example` a `.env.local` y llena los valores:

```bash
cp .env.local.example .env.local
```

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Despliegue

El proyecto se despliega automáticamente en Vercel al hacer push a `main`.
