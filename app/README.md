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
| Usuarios globales | `/admin/users` | CRUD de usuarios de la plataforma: resumen por rol, búsqueda, filtros (rol, colegio, estado), paginación, alta/edición en modal, bloqueo y borrado lógico. Rector, Secretaría y Padre deben tener colegio; el Padre además se asocia a un estudiante de ese colegio con su parentesco. |
| Panel de roles | `/panel` y subrutas | Panel de Rector, Secretaría y Padre de Familia con navegación por rol. |
| Panel por rol · Matrículas | `/panel/secretary/enrollments` | Cola de expedientes del colegio: búsqueda en vivo, filtros por grado/estado/pago, exportación a Excel y vista/edición del expediente; registra matrícula nueva con wizard embebido. |
| Panel por rol · Notificaciones | `/panel/{rol}/notifications` | Avisos internos; Rector/Secretaría ven el engranaje de reglas incrustadas en la fila de filtros. |

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
│   ├── admin/            # Gestión global de colegios y usuarios
│   ├── rector/           # Páginas y servicios específicos del Rector
│   └── panel/
│       ├── components/   # Header compartido y componentes del panel
│       ├── config/       # Menús por rol y autoridades
│       ├── layouts/      # Sidebar, header, scroll y outlet
│       ├── services/     # Requesters: notificaciones y reglas de notificaciones
│       └── pages/        # Dashboard y módulos del panel (incluidas Notifications)
└── main.jsx              # Providers y definición de rutas
```

## Scripts

| Comando | Descripción |
|---|---|
| `pnpm run dev` | Servidor Vite con HMR. |
| `pnpm run build` | Build optimizado de producción. |
| `pnpm run preview` | Sirve localmente el build generado. |
| `pnpm run lint` | Ejecuta ESLint. |

## Notificaciones en el panel

La barra superior muestra un botón de campana con puntico de no leídas en todos los roles del panel y lleva a la página según rol (`/panel/{rol}/notifications`). La página filtra por Todos / No leídos / pagos / documentos según el rol; cada aviso lleva a la sección de origen (por ejemplo, a la cola de matrícula o a Documentos). Un botón por aviso individual permite alternar entre leída/no leída, y hay control global "Marcar todas como leídas". El header del panel muestra el contador de no leídas y lo actualiza al cambiar la ruta. Las tarjetas de reglas de notificación se organizan en una grilla de dos columnas.

Para roles **Rector** y **Secretaría**, la fila de filtros añade, al extremo derecho, un engranaje que abre las **Reglas de notificaciones**: listar, crear, editar, activar y desactivar avisos por evento (observación de documento, documentos pendientes, mora, manual, reserva…) y canal (`email`, `whatsapp`, `internal`). Los envíos reales los decide esta regla (la configuración es del colegio); el correo al acudiente se dispara en la revisión de documentos (rechazo con observación / aprueba: CU009/CU010).

Nada de esto necesita variables extra en `app/.env`: la SPA usa el mismo cliente apuntando a `VITE_API_URL_*`. La configuración de reglas vive toda en el backend (verificable e independiente de cachés del navegador).

## Pagos en el panel

La página de pagos del acudiente (`/panel/guardian/payments`) muestra las obligaciones pendientes y permite preparar una referencia para pago presencial. La opción de Secretaría **Registrar pago en efectivo** permite buscar estudiantes del colegio, seleccionar matrícula, pensiones o recargos, registrar monto recibido, fecha y observaciones, y emitir el recibo.

Al confirmar el pago, el modal muestra número de comprobante, referencia, total, cambio y estado del correo. El botón **Descargar comprobante PDF** solicita el archivo con el token de sesión y descarga el PDF autenticado. Si el acudiente tiene correo, la API también adjunta y envía el comprobante.


## Matrículas en el panel

La página **Matrículas** del panel de Secretaría (`/panel/secretary/enrollments`) replica el prototipo visual: cola de expedientes con búsqueda en vivo (nombre, documento o número de expediente), filtros por grado, estado y pago, pills de estado (por verificar / verificados / con observaciones), paginación y exportación a Excel. Los documentos de cada expediente se pueden ver con visor integrado y las observaciones aparecen junto a cada documento.

El detalle del expediente muestra una cabecera con icono, nombre del estudiante y grado, fecha de solicitud y documentos cargados. Desde allí puede **editarse** el estudiante y el acudiente (botón lápiz): formulario con los componentes del proyecto, sincronizando el correo/usuario del acudiente y bloqueado automáticamente con un aviso cuando todos los documentos obligatorios están aprobados.

El botón **Nueva matrícula** abre el mismo wizard de matrícula del padre en un modal embebido. El flujo público `/enroll/:code` permanece intacto.

El panel se ve igual en modo claro y oscuro (componentes y tokens del tema; alto contraste en pills, encabezados y botones). Las **Reglas de notificaciones** (Rector y Secretaría) se organizan en una grilla de dos columnas.
