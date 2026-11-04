# Stepfive (Inno Project) 1.0.3v

Monorepo fullstack compuesto por un backend REST en **Node.js + TypeScript + Express 5 + PostgreSQL** y un frontend en **Vite + React**. El proyecto implementa un sistema completo de autenticación y autorización basado en roles y permisos, con una arquitectura modular en capas y un ORM personalizado construido desde cero.

### Que se puede hacer hoy

- Registrar usuarios (wizard de 5 pasos con carga de imagen a Firebase).
- Iniciar y cerrar sesion (JWT + cookie HTTP-only).
- Administrar usuarios: listar, ver detalles, autorizar/desautorizar, asignar roles, eliminar.
- Administrar roles: crear, editar, activar/desactivar, asignar permisos, eliminar.
- Consultar permisos: listado con filtros por tipo.
- Proteger rutas del frontend por roles y permisos.
- Tema claro/oscuro.

## Requisitos previos

| Herramienta | Version minima |
|-------------|----------------|
| Node.js     | 18 LTS         |
| pnpm        | 8+             |
| Supabase    | Opcional, solo para desarrollo local |

## Quick Start

```bash
# 1. Clonar e instalar
git clone <url-del-repo> && cd stepfive
pnpm install --prefix api
pnpm install --prefix app

# 2. Configurar backend
cp api/.env.example api/.env
# Edita api/.env con las credenciales de Supabase (ver api/README.md)

# 3. Configurar frontend
cp app/.env.example app/.env
# Edita app/.env con la URL del backend

# 4. Levantar (dos terminales)
pnpm run dev --prefix api   # http://localhost:3000/api/v1
pnpm run dev --prefix app   # http://localhost:5173
```

### Verificar que funciona

- Backend: abre `http://localhost:3000/api/v1/auth/health` y espera un JSON con `"status": "ok"`.
- Frontend: abre `http://localhost:5173` y deberia cargar la pantalla de login.

## Estructura del Monorepo

![WhatsApp Image 2026-04-13 at 11 06 12 PM](https://github.com/user-attachments/assets/a889c7fb-8dc9-4fa9-a702-a665fbf7af8b)


```
stepfive/
├── api/          # Backend — Express 5, TypeScript, ORM custom, PostgreSQL
│   └── src/
│       ├── core/     # Framework: ORM, router, decoradores, DI, middlewares
│       └── auth/     # Modulo de auth: controladores, servicios, entidades, repos
├── app/          # Frontend — React 18, Vite, React Router
│   └── src/
│       ├── core/     # Componentes, contextos, hooks, servicios y estilos compartidos
│       └── modules/  # auth (login/registro) y panel (dashboard, usuarios, roles)
└── README.md
```

> La carpeta `shared/` no existe aun; esta reservada para codigo compartido si el equipo decide crearla.

## Scripts por proyecto

### Backend (`api/`)

| Comando         | Descripcion                          |
|-----------------|--------------------------------------|
| `pnpm run dev`   | Desarrollo con hot-reload (tsx)      |
| `pnpm run build` | Compila TypeScript a `dist/`         |
| `pnpm start`     | Ejecuta build de produccion          |

### Frontend (`app/`)

| Comando           | Descripcion                        |
|-------------------|------------------------------------|
| `pnpm run dev`     | Servidor de desarrollo con HMR     |
| `pnpm run build`   | Build de produccion                |
| `pnpm run preview` | Preview del build                  |
| `pnpm run lint`    | ESLint                             |

### Ejecucion simultanea

Sin herramientas extra (dos terminales):

```bash
# Terminal 1
pnpm run dev --prefix api

# Terminal 2
pnpm run dev --prefix app
```

Con una sola terminal:

```bash
pnpm dlx concurrently "pnpm run dev --prefix api" "pnpm run dev --prefix app"
```

## Documentacion detallada

- [api/README.md](./api/README.md) — variables de entorno, base de datos, endpoints de auth.
- [app/README.md](./app/README.md) — servidor de desarrollo, AuthContext, configuracion de API.
