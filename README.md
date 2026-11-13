# ViBoxSchool

ViBoxSchool es una plataforma web multi-colegio (multi-tenant) para gestionar perfiles institucionales, procesos de matrícula y pensiones. Incluye un directorio público de colegios, un wizard de matrícula en línea y paneles por rol para Administrador global, Rector, Secretaría y Padre de Familia.

El monorepo contiene una API REST con Node.js, TypeScript, Express 5 y PostgreSQL, y una aplicación SPA en React 18 y Vite. El backend usa un ORM y un sistema de enrutamiento basados en decoradores propios.

## Funcionalidades

- Explorar colegios aliados y consultar el perfil público de cada institución.
- Iniciar una solicitud de matrícula en cinco pasos, cargar documentos y enviarla para revisión.
- Gestionar colegios desde el panel de Administración global, incluidos su estado activo/suspendido.
- Mostrar navegación y secciones según el rol autenticado.
- Usar autenticación JWT con validación de roles y permisos en el servidor.
- Cambiar entre modo claro y oscuro.
- Guardar documentos de matrícula en un bucket privado de Supabase Storage con URLs firmadas.

Los módulos de usuarios, auditoría, correos, parámetros globales y ciertas opciones de los paneles todavía muestran una pantalla de “Módulo en desarrollo”.

## Requisitos

- Node.js 18 LTS o superior.
- pnpm 8 o superior.
- PostgreSQL (local o el Session Pooler de Supabase).
- Un proyecto Supabase Storage para las cargas de documentos de matrícula.

## Inicio rápido

Desde la raíz del repositorio:

```powershell
pnpm install --dir api
pnpm install --dir app
Copy-Item api/.env.example api/.env
Copy-Item app/.env.example app/.env
```

Completa los archivos `.env` con la configuración del entorno y ejecuta la API y la app en terminales separadas:

```powershell
# Terminal 1
pnpm --dir api run dev

# Terminal 2
pnpm --dir app run dev
```

La app estará en `http://localhost:5173` y la API en `http://localhost:3000/api/v1`. Consulta [api/README.md](./api/README.md) y [app/README.md](./app/README.md) para configuración, endpoints y detalles de cada módulo.

## Estructura del monorepo

```text
ViBoxSchool/
├── api/                              # API REST (Express + TypeScript + PostgreSQL)
│   ├── src/
│   │   ├── core/                     # Router, decoradores, DI, ORM y middleware
│   │   ├── auth/                     # Autenticación, usuarios, roles y permisos
│   │   ├── schools/                  # Gestión y directorio público de colegios
│   │   └── enrollments/              # Matrículas, borradores y documentos
│   ├── .env.example
│   └── README.md
├── app/                              # SPA (React + Vite)
│   ├── src/
│   │   ├── core/                     # Componentes, contextos, servicios y tokens
│   │   ├── modules/
│   │   │   ├── public/               # Landing, perfil y wizard de matrícula
│   │   │   ├── auth/                 # Inicio de sesión
│   │   │   ├── admin/                # Gestión global de colegios
│   │   │   └── panel/                # Layout, navegación y paneles por rol
│   │   └── main.jsx                  # Providers y rutas
│   ├── .env.example
│   └── README.md
└── README.md
```

## Comandos

| Proyecto | Comando | Descripción |
|---|---|---|
| API | `pnpm --dir api run dev` | Servidor de desarrollo con recarga |
| API | `pnpm --dir api run build` | Compilar TypeScript |
| API | `pnpm --dir api run seed:demo-accounts` | Crear o actualizar las cuentas de prueba |
| App | `pnpm --dir app run dev` | Servidor Vite |
| App | `pnpm --dir app run build` | Build de producción |
| App | `pnpm --dir app run lint` | ESLint |

Para configurar la base de datos, el almacenamiento privado y los seeders, consulta [api/README.md](./api/README.md). La configuración del frontend y sus rutas se describe en [app/README.md](./app/README.md).
