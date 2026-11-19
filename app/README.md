# AplicaciÃ³n web de ViBoxSchool

SPA de ViBoxSchool construida con React 18, Vite y React Router. Incluye vistas pÃºblicas de colegios y matrÃ­cula, inicio de sesiÃ³n y paneles autenticados segÃºn el rol.

## Vistas y rutas

| Vista | Ruta | DescripciÃ³n |
|---|---|---|
| Landing / directorio | `/` | Presenta y permite explorar colegios aliados. |
| Perfil del colegio | `/school/:code` o `/schools/:code` | InformaciÃ³n institucional, cupos, valores y acceso al wizard. |
| Wizard de matrÃ­cula | `/enroll/:code` | Flujo de cinco pasos: estudiante, acudiente, documentos, revisiÃ³n y confirmaciÃ³n. |
| Login | `/auth` | Inicio de sesiÃ³n por rol; los botones de rol seleccionan el rol y el envÃ­o ocurre al presionar Ingresar. |
| AdministraciÃ³n global | `/admin/schools` | Lista, filtros, ediciÃ³n, alta y suspensiÃ³n/reactivaciÃ³n lÃ³gica de colegios. |
| Usuarios globales | `/admin/users` | CRUD de usuarios de la plataforma: resumen por rol, bÃºsqueda, filtros (rol, colegio, estado), paginaciÃ³n, alta/ediciÃ³n en modal, bloqueo y borrado lÃ³gico. Rector, SecretarÃ­a y Padre deben tener colegio; el Padre ademÃ¡s se asocia a un estudiante de ese colegio con su parentesco. |
| Panel de roles | `/panel` y subrutas | Panel de Rector, SecretarÃ­a y Padre de Familia con navegaciÃ³n por rol. |
| Panel por rol Â· Notificaciones | `/panel/{rol}/notifications` | Avisos internos; Rector/SecretarÃ­a ven el engranaje de reglas incrustadas en la fila de filtros. |

Algunas opciones de los paneles se muestran como â€œMÃ³dulo en desarrolloâ€. Las rutas privadas estÃ¡n protegidas por sesiÃ³n, rol y/o permisos.

## InstalaciÃ³n y desarrollo

Desde la raÃ­z del monorepo:

```powershell
pnpm install --dir app
Copy-Item app/.env.example app/.env
pnpm --dir app run dev
```

La aplicaciÃ³n de desarrollo queda disponible en `http://localhost:5173`.

## Variables de entorno

Vite expone al cliente Ãºnicamente variables con prefijo `VITE_`. ConfigÃºralas en `app/.env`:

| Variable | Uso |
|---|---|
| `VITE_IS_DEV_MODE` | `true` selecciona URL de desarrollo; `false` selecciona producciÃ³n. Si se omite, Vite usa desarrollo en dev y producciÃ³n en el build. |
| `VITE_API_URL_DEV` | Base API de desarrollo, por ejemplo `http://localhost:3000/api/v1`. |
| `VITE_API_URL_PROD` | Base API en producciÃ³n; por defecto `/api/v1`. |
| `VITE_SUPABASE_URL` | URL del proyecto Supabase para cargas firmadas. |
| `VITE_SUPABASE_ANON_KEY` | Clave pÃºblica anon usada por el navegador para subir el archivo con la credencial firmada. |

La clave `SUPABASE_SERVICE_ROLE_KEY` es exclusiva del backend. No debe tener prefijo `VITE_` ni incluirse en el bundle.

## Documentos de matrÃ­cula y Supabase Storage

El bucket `enrollment-documents` debe ser privado. El flujo funciona asÃ­:

1. La app pide al API crear un borrador para el colegio y periodo/grado seleccionados.
2. Para cada archivo, solicita una credencial/URL temporal usando el token del borrador.
3. El navegador carga el archivo directamente a Supabase Storage con la clave pÃºblica anon y la credencial firmada.
4. La app informa al API la ruta y metadatos; el servidor verifica pertenencia, tamaÃ±o, MIME y firma real del archivo.
5. Al enviar el wizard, el API crea la matrÃ­cula y sus registros documentales.

Los archivos permitidos son PDF y JPEG, sujetos a los requisitos que configure el colegio. El token temporal se envÃ­a en el header `x-enrollment-token`. Configura las credenciales privadas de Storage en `api/.env`; detalles en [../api/README.md](../api/README.md).

## Temas y componentes compartidos

Los estilos globales y los tokens viven en `src/core/styles/`. `tokens.css` define superficies, tipografÃ­a, bordes y colores semÃ¡nticos para modo claro y oscuro; los componentes y mÃ³dulos deben consumir esas variables en lugar de fijar colores de tema.

`ThemeContext` gestiona la preferencia del usuario y el atributo `data-theme`. El componente `ThemeToggle` estÃ¡ disponible en las vistas pÃºblicas y en el encabezado del panel. Los componentes reutilizables del `core` incluyen, entre otros, el logo de plataforma, controles de tema, protecciÃ³n de rutas, modal, notificaciones y conexiÃ³n offline.

## AutenticaciÃ³n y autorizaciÃ³n

La sesiÃ³n JWT se administra en `src/core/contexts/AuthContext.jsx`. Al iniciar sesiÃ³n, el frontend envÃ­a usuario, contraseÃ±a y rol seleccionado; el API contrasta el rol real asignado a la cuenta. Las rutas privadas usan `ProtectedRoute` y `hasAuthorities` para proteger contenido por rol y permisos. La sesiÃ³n se revalida con el API al cargar el contexto.

## Estructura de `src/`

```text
src/
â”œâ”€â”€ core/
â”‚   â”œâ”€â”€ components/       # Logo, ThemeToggle, ProtectedRoute, Modal y controles comunes
â”‚   â”œâ”€â”€ config/           # ConfiguraciÃ³n de URL de API y servicios
â”‚   â”œâ”€â”€ contexts/         # AuthContext, ThemeContext, NotificationContext
â”‚   â”œâ”€â”€ hooks/            # Hooks compartidos, incluido el tema
â”‚   â”œâ”€â”€ services/         # Cliente HTTP
â”‚   â””â”€â”€ styles/           # CSS global y tokens claro/oscuro
â”œâ”€â”€ modules/
â”‚   â”œâ”€â”€ public/           # Landing, perfil del colegio y wizard de matrÃ­cula
â”‚   â”œâ”€â”€ auth/             # Login
â”‚   â”œâ”€â”€ admin/            # GestiÃ³n global de colegios y usuarios
â”‚   â”œâ”€â”€ rector/           # PÃ¡ginas y servicios especÃ­ficos del Rector
â”‚   â””â”€â”€ panel/
â”‚       â”œâ”€â”€ components/   # Header compartido y componentes del panel
â”‚       â”œâ”€â”€ config/       # MenÃºs por rol y autoridades
â”‚       â”œâ”€â”€ layouts/      # Sidebar, header, scroll y outlet
â”‚       â”œâ”€â”€ services/     # Requesters: notificaciones y reglas de notificaciones
â”‚       â””â”€â”€ pages/        # Dashboard y mÃ³dulos del panel (incluidas Notifications)
â””â”€â”€ main.jsx              # Providers y definiciÃ³n de rutas
```

## Scripts

| Comando | DescripciÃ³n |
|---|---|
| `pnpm run dev` | Servidor Vite con HMR. |
| `pnpm run build` | Build optimizado de producciÃ³n. |
| `pnpm run preview` | Sirve localmente el build generado. |
| `pnpm run lint` | Ejecuta ESLint. |

## Notificaciones en el panel

La barra superior muestra un botÃ³n de campana con puntico de no leÃ­das en todos los roles del panel y lleva a la pÃ¡gina segÃºn rol (`/panel/{rol}/notifications`). La pÃ¡gina filtra por Todos / No leÃ­dos / pagos / documentos segÃºn el rol; cada aviso lleva a la secciÃ³n de origen (por ejemplo, a la cola de matrÃ­cula o a Documentos). Un botÃ³n por aviso individual permite alternar entre leÃ­da/no leÃ­da, y hay control global "Marcar todas como leÃ­das". El header del panel muestra el contador de no leÃ­das y lo actualiza al cambiar la ruta.

Para roles **Rector** y **SecretarÃ­a**, la fila de filtros aÃ±ade, al extremo derecho, un engranaje que abre las **Reglas de notificaciones**: listar, crear, editar, activar y desactivar avisos por evento (observaciÃ³n de documento, documentos pendientes, mora, manual, reservaâ€¦) y canal (`email`, `whatsapp`, `internal`). Los envÃ­os reales los decide esta regla (la configuraciÃ³n es del colegio); el correo al acudiente se dispara en la revisiÃ³n de documentos (rechazo con observaciÃ³n / aprueba: CU009/CU010).

Nada de esto necesita variables extra en `app/.env`: la SPA usa el mismo cliente apuntando a `VITE_API_URL_*`. La configuraciÃ³n de reglas vive toda en el backend (verificable e independiente de cachÃ©s del navegador).

## Pagos en el panel

La pÃ¡gina de pagos del acudiente (`/panel/guardian/payments`) muestra las obligaciones pendientes y permite preparar una referencia para pago presencial. La opciÃ³n de SecretarÃ­a **Registrar pago en efectivo** permite buscar estudiantes del colegio, seleccionar matrÃ­cula, pensiones o recargos, registrar monto recibido, fecha y observaciones, y emitir el recibo.

Al confirmar el pago, el modal muestra nÃºmero de comprobante, referencia, total, cambio y estado del correo. El botÃ³n **Descargar comprobante PDF** solicita el archivo con el token de sesiÃ³n y descarga el PDF autenticado. Si el acudiente tiene correo, la API tambiÃ©n adjunta y envÃ­a el comprobante.

