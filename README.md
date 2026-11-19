# ViBoxSchool

ViBoxSchool es una plataforma web multi-colegio (multi-tenant) para gestionar perfiles institucionales, procesos de matrícula y pensiones. Incluye un directorio público de colegios, un wizard de matrícula en línea y paneles por rol para Administrador global, Rector, Secretaría y Padre de Familia.

**Versión: v1.1.0**

El monorepo contiene una API REST con Node.js, TypeScript, Express 5 y PostgreSQL, y una aplicación SPA en React 18 y Vite. El backend usa un ORM y un sistema de enrutamiento basados en decoradores propios.

## Funcionalidades

- Explorar colegios aliados y consultar el perfil público de cada institución.
- Iniciar una solicitud de matrícula en cinco pasos, cargar documentos y enviarla para revisión.
- Gestionar colegios desde el panel de Administración global, incluidos su estado activo/suspendido.
- Gestionar usuarios globales (Administrador, Rector, Secretaría y Padre de familia): todo usuario excepto el Administrador pertenece a un colegio y cada Padre se asocia a un estudiante de ese colegio.
- Revisar los expedientes de matrícula desde el panel de Rector/Secretaría: cola por colegio, búsqueda de estudiantes, vista previa del documento y aprobación o rechazo con observación obligatoria al rechazar.
- Configurar los parámetros académicos del colegio desde el panel del Rector: grados (nombre, capacidad, valor de matrícula, activos/inactivos), período académico y recargo por mora.
- Editar la información y la identidad del colegio desde el panel del Rector (p. ej. color institucional y niveles ofrecidos).
- Recibir notificaciones in-app en el panel según el rol (campana con contador de no leídas y lista con enlace a la sección correspondiente).
- Mostrar navegación y secciones según el rol autenticado.
- Usar autenticación JWT con validación de roles y permisos en el servidor.
- Cambiar entre modo claro y oscuro.
- Guardar documentos de matrícula en un bucket privado de Supabase Storage con URLs firmadas.

Los módulos de auditoría, correos, parámetros globales y ciertas opciones de los paneles todavía muestran una pantalla de “Módulo en desarrollo”.

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

## Novedades v1.1.0

- Módulo de notificaciones in-app (RF-31 a RF-34): tabla `Notifications`, API (`GET /notifications`, `GET /notifications/unread-count`, `PATCH /:id/read`, `PATCH /read-all`), campana con puntico en el encabezado y página de avisos por rol (Guardian, Rector, Secretaría) con marcar leída y navegación al tocar.
- Configuración de notificaciones por colegio (RF-35): `Rector`/`Secretaría`/`Admin` definen tipo de evento, canal (email/whatsapp/internal), anticipación, plantilla y hora de envío (`/notifications/settings`).
- Notificación automática al enviar la matrícula: aviso in-app a Rectoría y Secretaría con la referencia del expediente.
- Revisión de documentos (panel de Rector/Secretaría): cola de expedientes, búsqueda, visor de documentos y aprobación/rechazo con observación obligatoria al rechazar.
- Configuración académica del colegio (Rector): gestión de grados, período académico y recargo por mora.
- Configuración del colegio (Rector): información institucional e identidad visual editables.

## Estructura del monorepo

```text
ViBoxSchool/
├── api/                              # API REST (Express + TypeScript + PostgreSQL)
│   ├── src/
│   │   ├── core/                     # Router, decoradores, DI, ORM y middleware
│   │   ├── admin/                    # Usuarios globales (panel del Administrador)
│   │   ├── auth/                     # Autenticación, usuarios, roles y permisos
│   │   ├── schools/                  # Gestión y directorio público de colegios
│   │   ├── notifications/            # Notificaciones in-app y su configuración (RF-31 a RF-35)
│   │   └── enrollments/              # Matrículas, borradores y documentos
│   ├── .env.example
│   └── README.md
├── app/                              # SPA (React + Vite)
│   ├── src/
│   │   ├── core/                     # Componentes, contextos, servicios y tokens
│   │   ├── modules/
│   │   │   ├── public/               # Landing, perfil y wizard de matrícula
│   │   │   ├── auth/                 # Inicio de sesión
│   │   │   ├── admin/                # Gestión global de colegios y usuarios
│   │   │   ├── panel/                # Layout, navegación y paneles por rol
│   │   │   └── rector/               # Páginas del Rector (verificación, configuración)
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

## Módulo de pagos

El panel permite consultar conceptos pendientes por estudiante y gestionar pagos en efectivo. El acudiente puede generar referencias de pago; Secretaría puede registrar el pago recibido, indicar fecha, observaciones y monto recibido, y emitir un comprobante PDF. El comprobante se puede descargar desde la interfaz autenticada de Secretaría y se envía al correo del acudiente cuando está disponible.

Para detalles de endpoints y acceso, consulta [api/README.md](./api/README.md#pagos-payments). La interfaz de Secretaría está documentada en [app/README.md](./app/README.md#pagos-en-el-panel).

## Módulo de matrículas

El panel de Secretaría muestra la gestión de matrículas del colegio: cola de expedientes con búsqueda en vivo, filtros por grado/estado/pago, exportación a Excel, ver/editar los datos del estudiante y del acudiente y bloqueo automático cuando el expediente está 100 % verificado. El rector comparte la cola y la aprobación de documentos. El acudiente puede además iniciar la matrícula en línea con el wizard embebido desde el panel.

Para detalles de endpoints y acceso, consulta [api/README.md#matrículas-enrollments](./api/README.md#matrículas-enrollments). La interfaz está documentada en [app/README.md#matrículas-en-el-panel](./app/README.md#matrículas-en-el-panel).
