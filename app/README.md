# Aplicación web de ViBoxSchool

SPA de ViBoxSchool construida con React 18, Vite y React Router. Incluye vistas públicas de colegios y matrícula, inicio de sesión y paneles autenticados según el rol.

## Vistas y rutas

| Vista | Ruta | Descripción |
|---|---|---|
| Landing / directorio | `/` | Presenta y permite explorar colegios aliados. |
| Perfil del colegio | `/school/:code` o `/schools/:code` | Información institucional, cupos, valores y acceso al wizard. |
| Wizard de matrícula | `/enroll/:code` | Flujo de cinco pasos: estudiante, acudiente, documentos, revisión y confirmación. |
| Login | `/auth` | Inicio de sesión por rol; los botones de rol seleccionan el rol y el envío ocurre al presionar Ingresar. |
| Administración global | `/admin/schools` | Lista, filtros, edición, alta y suspensión/reactivación lógica de colegios. |
| Panel de roles | `/panel` y subrutas | Panel de Rector, Secretaría y Padre de Familia con navegación por rol. |

Algunas opciones de los paneles se muestran como “Módulo en desarrollo”. Las rutas privadas están protegidas por sesión, rol y/o permisos.

## Instalación y desarrollo

Desde la raíz del monorepo:

```powershell
pnpm install --dir app
Copy-Item app/.env.example app/.env
pnpm --dir app run dev
```

La aplicación de desarrollo queda disponible en `http://localhost:5173`.

## Variables de entorno

Vite expone al cliente únicamente variables con prefijo `VITE_`. Configúralas en `app/.env`:

| Variable | Uso |
|---|---|
| `VITE_IS_DEV_MODE` | `true` selecciona URL de desarrollo; `false` selecciona producción. Si se omite, Vite usa desarrollo en dev y producción en el build. |
| `VITE_API_URL_DEV` | Base API de desarrollo, por ejemplo `http://localhost:3000/api/v1`. |
| `VITE_API_URL_PROD` | Base API en producción; por defecto `/api/v1`. |
| `VITE_SUPABASE_URL` | URL del proyecto Supabase para cargas firmadas. |
| `VITE_SUPABASE_ANON_KEY` | Clave pública anon usada por el navegador para subir el archivo con la credencial firmada. |

La clave `SUPABASE_SERVICE_ROLE_KEY` es exclusiva del backend. No debe tener prefijo `VITE_` ni incluirse en el bundle.

## Documentos de matrícula y Supabase Storage

El bucket `enrollment-documents` debe ser privado. El flujo funciona así:

1. La app pide al API crear un borrador para el colegio y periodo/grado seleccionados.
2. Para cada archivo, solicita una credencial/URL temporal usando el token del borrador.
3. El navegador carga el archivo directamente a Supabase Storage con la clave pública anon y la credencial firmada.
4. La app informa al API la ruta y metadatos; el servidor verifica pertenencia, tamaño, MIME y firma real del archivo.
5. Al enviar el wizard, el API crea la matrícula y sus registros documentales.

Los archivos permitidos son PDF y JPEG, sujetos a los requisitos que configure el colegio. El token temporal se envía en el header `x-enrollment-token`. Configura las credenciales privadas de Storage en `api/.env`; detalles en [../api/README.md](../api/README.md).

## Temas y componentes compartidos

Los estilos globales y los tokens viven en `src/core/styles/`. `tokens.css` define superficies, tipografía, bordes y colores semánticos para modo claro y oscuro; los componentes y módulos deben consumir esas variables en lugar de fijar colores de tema.

`ThemeContext` gestiona la preferencia del usuario y el atributo `data-theme`. El componente `ThemeToggle` está disponible en las vistas públicas y en el encabezado del panel. Los componentes reutilizables del `core` incluyen, entre otros, el logo de plataforma, controles de tema, protección de rutas, modal, notificaciones y conexión offline.

## Autenticación y autorización

La sesión JWT se administra en `src/core/contexts/AuthContext.jsx`. Al iniciar sesión, el frontend envía usuario, contraseña y rol seleccionado; el API contrasta el rol real asignado a la cuenta. Las rutas privadas usan `ProtectedRoute` y `hasAuthorities` para proteger contenido por rol y permisos. La sesión se revalida con el API al cargar el contexto.

## Estructura de `src/`

```text
src/
├── core/
│   ├── components/       # Logo, ThemeToggle, ProtectedRoute, Modal y controles comunes
│   ├── config/           # Configuración de URL de API y servicios
│   ├── contexts/         # AuthContext, ThemeContext, NotificationContext
│   ├── hooks/            # Hooks compartidos, incluido el tema
│   ├── services/         # Cliente HTTP
│   └── styles/           # CSS global y tokens claro/oscuro
├── modules/
│   ├── public/           # Landing, perfil del colegio y wizard de matrícula
│   ├── auth/             # Login
│   ├── admin/            # Gestión global de colegios
│   └── panel/
│       ├── components/   # Header compartido y componentes del panel
│       ├── config/       # Menús por rol y autoridades
│       ├── layouts/      # Sidebar, header, scroll y outlet
│       └── pages/        # Dashboard y módulos del panel
└── main.jsx              # Providers y definición de rutas
```

## Scripts

| Comando | Descripción |
|---|---|
| `pnpm run dev` | Servidor Vite con HMR. |
| `pnpm run build` | Build optimizado de producción. |
| `pnpm run preview` | Sirve localmente el build generado. |
| `pnpm run lint` | Ejecuta ESLint. |
