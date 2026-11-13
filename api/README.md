# API de ViBoxSchool

Backend REST para la plataforma multi-colegio de matrículas y pensiones. Está construido con Node.js, TypeScript, Express 5 y PostgreSQL. El framework interno usa decoradores para rutas y autorización, inyección de dependencias y un ORM propio.

## Configuración

```powershell
pnpm install
Copy-Item .env.example .env
```

Configura las variables en `api/.env` antes de iniciar el servidor. No compartas ni subas ese archivo al repositorio.

| Variable | Requerida | Uso |
|---|---:|---|
| `APP_NAME` | No | Nombre que muestra el servidor al iniciar. |
| `HOST_NAME` | No | Host incluido en el mensaje de inicio. |
| `VERSIONING` | No | Prefijo versionado de la API; por defecto `/api/v1`. |
| `PORT` | No | Puerto HTTP; por defecto `3000`. |
| `DB_HOST` | Sí | Host PostgreSQL o Session Pooler de Supabase. |
| `DB_PORT` | No | Puerto PostgreSQL; por defecto `5432`. |
| `DB_USER` | Sí | Usuario de la base de datos. |
| `DB_PASSWORD` | Sí | Contraseña de la base de datos. |
| `DB_NAME` | Sí | Nombre de la base de datos. |
| `JWT_SECRET` | Sí | Secreto para firmar y verificar JWT. Usa un valor largo y aleatorio. |
| `JWT_EXPIRES_IN` | Sí | Duración del JWT, por ejemplo `30d`. |
| `SUPABASE_URL` | Para documentos | URL del proyecto Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Para documentos | Clave privada usada en el servidor para URLs de carga firmadas. Nunca se expone al frontend. |
| `DEMO_LOGIN_ENABLED` | No | Solo habilita `POST /auth/demo-login` si vale `true`. |
| `VIBOX_DEMO_PASSWORD` | Para demos | Contraseña común que asigna el seeder de cuentas de prueba. Debe cumplir la política de contraseña fuerte. |

La conexión a Supabase PostgreSQL puede usar Session Pooler, útil en entornos con IPv4. El ORM ejecuta `Database.sync()` al arrancar la API y crea/sincroniza las tablas definidas por las entidades registradas.

## Ejecutar y compilar

```powershell
pnpm run dev
pnpm run build
pnpm start
```

La base de la API local es `http://localhost:3000/api/v1`. Las rutas protegidas reciben `Authorization: <JWT>` o la cookie HTTP-only `accessToken`.

## Módulos y endpoints

Los controladores se montan bajo el prefijo configurado en `VERSIONING`.

### Autenticación (`/auth`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/auth/health` | Público | Estado del servicio. |
| `POST` | `/auth/login` | Público | Autentica `username`, `password` y el `role` seleccionado; verifica los roles reales del usuario. |
| `POST` | `/auth/demo-login` | Público y opcional | Inicio de sesión para demos, sujeto a `DEMO_LOGIN_ENABLED`. |
| `POST` | `/auth/logout` | Sesión | Cierra sesión e invalida el token. |
| `GET` | `/auth/me` | Sesión | Perfil de la cuenta autenticada. |
| `GET` | `/auth/session` | Sesión | Estado de la sesión actual. |
| `GET` | `/auth/session/roles` | Sesión | Roles del usuario actual. |
| `GET` | `/auth/session/permissions` | Sesión | Permisos del usuario actual. |
| `PATCH` | `/auth/modify` | Sesión | Actualiza datos del perfil. |
| `PATCH` | `/auth/reset` | Sesión | Cambia la contraseña. |
| `POST` | `/auth/register` | Admin | Registra una cuenta administrativamente. |

Los controladores de usuarios, roles, permisos y autorización también exponen endpoints bajo `/auth`: `/auth/users`, `/auth/roles`, `/auth/permissions`, `/auth/assign/roles`, `/auth/revoke/roles`, `/auth/assign/permissions`, `/auth/revoke/permissions`, `/auth/authorize/:username` y `/auth/disauthorize/:username`. Las operaciones administrativas requieren los permisos correspondientes.

### Colegios (`/schools`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/schools/discover` | Público | Directorio de colegios aliados activos. |
| `GET` | `/schools/:code` | Público | Perfil público, grados, cupos y requisitos de matrícula. |
| `GET` | `/schools` | Admin | Lista colegios, incluidos suspendidos y no eliminados lógicamente. |
| `POST` | `/schools` | Admin | Crea colegio y valores académicos iniciales. |
| `PATCH` | `/schools/:id` | Admin | Edita los datos principales del colegio. |
| `PATCH` | `/schools/:id/status` | Admin | Cambia `status` entre `active` y `suspended`, sincronizando `isActive`. |
| `PATCH` | `/schools/:id/deactivate` | Admin | Suspende el colegio (acción equivalente de compatibilidad). |

El directorio público filtra colegios suspendidos, inactivos, eliminados o no aliados.

### Matrículas (`/enrollments`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/enrollments` | Público | Crea un borrador de matrícula y devuelve un token de acceso temporal. |
| `POST` | `/enrollments/:id/documents/upload-url` | Token de borrador | Emite URL/credenciales firmadas para cargar un documento al bucket privado. |
| `POST` | `/enrollments/:id/documents` | Token de borrador | Verifica y registra el documento cargado. |
| `POST` | `/enrollments/:id/submit` | Token de borrador | Valida y envía la solicitud de matrícula. |

Las rutas de documento y envío reciben el token del borrador mediante el header `x-enrollment-token`. El borrador tiene vencimiento y el backend valida colegio, periodo, cupos, tipo documental y metadatos/bytes de los archivos.

## Aislamiento multi-tenant

Cada colegio es una entidad `School` identificada por su `id`. Los registros institucionales de matrículas, periodos, estudiantes, grados, documentos y requisitos llevan `schoolId`. Las consultas y las relaciones de matrícula acotan los registros por ese identificador, además de validar que `gradePeriodId` pertenezca a la combinación esperada de `schoolId` y `periodId`. Esto actúa como una clave compuesta lógica para evitar asociar por error datos de distintos colegios.

Las tablas de relaciones muchos-a-muchos del ORM usan claves primarias compuestas con ambos identificadores (por ejemplo, usuario/rol). Los endpoints públicos solo exponen datos de colegios aliados activos; la API administrativa conserva la visibilidad de colegios suspendidos para permitir su reactivación.

## ORM y arquitectura

`src/core/orm` contiene los decoradores de entidad/columna/relación, el `Database` de PostgreSQL y el `BaseRepository`. Durante el arranque, las entidades importadas en `src/index.ts` se registran y `Database.sync()` sincroniza las tablas y relaciones. Los repositorios de escuelas y matrículas contienen SQL explícito para las consultas multi-tenant y las operaciones transaccionales.

`CoreRouter` descubre los controladores y registra rutas definidas con decoradores como `@Controller`, `@Get`, `@Post`, `@Patch`, `@Roles`, `@Permissions` y `@Public`. El middleware de autenticación verifica JWT y el handler aplica roles/permisos antes del controlador.

```text
src/
├── core/              # Config, router, decoradores, DI, middleware y ORM
├── auth/              # Usuarios, autenticación, roles, permisos y seed demo
├── schools/           # Colegios, directorio y seed de colegios
└── enrollments/       # Matrículas, periodos, grados y documentos
```

## Datos iniciales y seeders

1. Inicia la API con las credenciales de DB configuradas; el ORM sincroniza el esquema.
2. Inicializa roles y permisos base ejecutando una vez `src/core/orm/database/scripts/init.sql` en el SQL Editor de PostgreSQL/Supabase.
3. Para cargar colegios de demostración, ejecuta `src/schools/scripts/seed-schools.sql` después de que exista la tabla `Schools`.
4. Para generar o actualizar las cuentas de prueba, define `VIBOX_DEMO_PASSWORD` en `.env` y ejecuta:

   ```powershell
   pnpm run seed:demo-accounts
   ```

   Crea las cuentas de roles Admin, Rector, Secretaría y Padre de Familia. Para habilitar el login de demo en un entorno apropiado, configura además `DEMO_LOGIN_ENABLED=true`. No habilites este acceso en producción sin una decisión explícita de despliegue.

El seeder de colegios es SQL y se ejecuta manualmente. El seeder de cuentas es un script Node que usa las variables DB del API.

## Supabase Storage para matrícula

Crea el bucket privado `enrollment-documents`. Configura `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` solo en el API. El backend genera credenciales firmadas de corta duración, valida la ruta bajo el prefijo del colegio/borrador/requisito, revisa MIME, tamaño y firma del archivo, y luego asocia el documento al borrador. Nunca expongas la service-role key.

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `pnpm run dev` | Desarrollo con `tsx` y recarga. |
| `pnpm run build` | Compilación TypeScript. |
| `pnpm start` | Ejecuta `dist/index.js`. |
| `pnpm run seed:demo-accounts` | Crea/actualiza las cuentas de demostración. |
