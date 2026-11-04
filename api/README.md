# API (`/api`)

Servicio backend del proyecto ViBoxSchool. Expone una API REST para **directorio público de colegios** e identidad y control de acceso (IAM).

Construido con un **framework custom** sobre Express 5: decoradores para rutas (`@Controller`, `@Get`, `@Post`...), inyeccion de dependencias (`@Inject`), un ORM propio con sincronizacion automatica de esquema, y middleware de autorizacion basado en permisos.

### Entidades del sistema

| Entidad        | Tabla            | Proposito                                                     |
|----------------|------------------|---------------------------------------------------------------|
| `User`         | `Users`          | Cuenta y perfil (nombre, documento, contacto, imagen, flags)  |
| `Role`         | `Roles`          | Rol con nombre, alias, descripcion (ej: Admin, Guest, User)   |
| `Permission`   | `Permissions`    | Permiso granular con tipo (Access, Create, Read, Update, etc.) |
| `BlockedToken` | `BlockedTokens`  | Tokens JWT revocados (logout)                                  |
| `School`       | `Schools`        | Perfil institucional y publicación en el directorio público   |

Relaciones: `UsersRoles` (M2M usuario-rol), `RolesPermissions` (M2M rol-permiso).

## Instalacion

```bash
cd api
pnpm install
cp .env.example .env   # edita con tus valores
```

## Variables de entorno (`.env`)

| Variable       | Descripcion                        | Ejemplo                        |
|----------------|------------------------------------|--------------------------------|
| `APP_NAME`     | Nombre de la app                   | `Stepfive Inno Project API`    |
| `VERSIONING`   | Prefijo de rutas                   | `/api/v1`                      |
| `PORT`         | Puerto del servidor                | `3000`                         |
| `DB_HOST`      | Host de PostgreSQL                 | `aws-0-[region].pooler.supabase.com` |
| `DB_PORT`      | Puerto de PostgreSQL               | `5432`                         |
| `DB_USER`      | Usuario de PostgreSQL              | `postgres.[your-project-ref]`  |
| `DB_PASSWORD`  | Contrasena de PostgreSQL           | `postgres`                     |
| `DB_NAME`      | Nombre de la base de datos         | `postgres`                     |
| `JWT_SECRET`   | Clave para firmar tokens JWT       | `mi_clave_secreta`             |
| `JWT_EXPIRES_IN`| Expiracion del token              | `30d`                          |

> **Nota:** La conexion usa el Session Pooler de Supabase (IPv4) en lugar de la conexion directa (IPv6), porque muchas redes no soportan IPv6.

## Base de datos: migraciones y seeders

### 1) Configurar Supabase

1. Crea un proyecto en Supabase.
2. Ve a **Settings → Database → Connection String**.
3. Selecciona **Session pooler** y copia los valores de conexion al archivo `.env`.

### 2) Migraciones (automaticas)

Al ejecutar `pnpm run dev`, el ORM sincroniza las tablas automaticamente. Veras en consola:

```
[ORM] ✔ Initializing Database...
[ORM] ✔ Migration completed
[ORM] ✔ Database ready
```

No hay comando `pnpm run migrate` separado; la sincronizacion ocurre cada vez que inicia el servidor.

### 3) Seed inicial (opcional)

Carga roles, permisos y sus asignaciones base. Ejecuta el contenido de `src/core/orm/database/scripts/init.sql` en el **SQL Editor** de Supabase.

Esto inserta los roles `Guest`, `User` y `Admin`, mas los permisos CRUD y los asigna al rol `Admin`.

## Endpoints de auth

**Base URL local:** `http://localhost:3000/api/v1`

### Directorio público de colegios (sin token)

| Metodo | Ruta                     | Descripcion |
|--------|--------------------------|-------------|
| `GET`  | `/schools/discover`      | Colegios aliados activos, ordenados por nombre |
| `GET`  | `/schools/:code`         | Perfil público de un colegio por su código corto |

El directorio y el perfil solo incluyen colegios con `status = active`, `isActive = true`, `isDeleted = false` e `isPartner = true`. El ORM sincroniza la tabla `Schools` al iniciar la API.

### Rutas publicas (sin token)

#### `POST /auth/register`

Registra un nuevo usuario.

**Request:**

```json
{
  "name": "Juan Perez",
  "username": "juanperez",
  "documentType": "CC",
  "documentNumber": "123456789",
  "phoneNumber": "+573001234567",
  "email": "juan@example.com",
  "password": "MiPassword123!",
  "birthdate": "1995-06-15"
}
```

**Campos obligatorios:** `name`, `username`, `documentType`, `documentNumber`, `phoneNumber`, `email`, `password`.

**Validaciones importantes:**
- `username`: alfanumerico, entre 2 y 50 caracteres.
- `password`: minimo 8 caracteres, al menos una letra, un numero y un simbolo (`@$!%*?&`).
- `email`: formato valido.
- `birthdate`: formato `YYYY-MM-DD`.

**Response `201`:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Juan Perez",
  "username": "juanperez",
  "email": "juan@example.com",
  "documentType": "CC",
  "documentNumber": "123456789",
  "phoneNumber": "+573001234567",
  "birthdate": "1995-06-15T00:00:00.000Z",
  "isAuthorized": true,
  "isOnline": false,
  "status": "Created",
  "createdAt": "2026-04-13T22:00:00.000Z"
}
```

---

#### `POST /auth/login`

Inicia sesion. Devuelve un JWT en el body y como cookie HTTP-only `accessToken`.

**Request:**

```json
{
  "username": "juanperez",
  "password": "MiPassword123!"
}
```

**Response `201`:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Juan Perez",
    "username": "juanperez",
    "email": "juan@example.com",
    "isOnline": true,
    "lastLogin": "2026-04-13T22:00:00.000Z",
    "roles": ["Guest"],
    "permissions": []
  }
}
```

### Rutas protegidas (requieren header `Authorization: <token>`)

#### Sesion y cuenta

| Metodo  | Ruta             | Descripcion                          |
|---------|------------------|--------------------------------------|
| `POST`  | `/auth/logout`   | Cierra sesion e invalida el token    |
| `GET`   | `/auth/me`       | Datos del usuario autenticado        |
| `PATCH` | `/auth/modify`   | Modifica datos del usuario           |
| `PATCH` | `/auth/reset`    | Cambia contrasena                    |
| `GET`   | `/auth/session`  | Info de sesion actual                |
| `GET`   | `/auth/session/roles` | Roles del usuario actual        |
| `GET`   | `/auth/session/permissions` | Permisos del usuario actual |

#### `PATCH /auth/reset` — ejemplo

```json
{
  "oldPassword": "MiPassword123!",
  "newPassword": "NuevaPassword456!"
}
```

#### CRUD de usuarios (requiere permisos `ReadUsers`, `CreateUsers`, etc.)

| Metodo   | Ruta                    | Descripcion                  |
|----------|-------------------------|------------------------------|
| `GET`    | `/auth/users`           | Listar usuarios              |
| `GET`    | `/auth/users/:username` | Obtener por username         |
| `POST`   | `/auth/users`           | Crear usuario                |
| `PUT`    | `/auth/users/:username` | Actualizar usuario           |
| `DELETE` | `/auth/users/:username` | Eliminar usuario (soft)      |
| `POST`   | `/auth/authorize/:username`   | Autorizar usuario     |
| `POST`   | `/auth/disauthorize/:username`| Desautorizar usuario  |

#### CRUD de roles (requiere permisos `ReadRoles`, `CreateRoles`, etc.)

| Metodo   | Ruta                             | Descripcion                  |
|----------|----------------------------------|------------------------------|
| `GET`    | `/auth/roles`                    | Listar roles                 |
| `POST`   | `/auth/roles`                    | Crear rol                    |
| `GET`    | `/auth/roles/:name`              | Obtener por nombre           |
| `PUT`    | `/auth/roles/:name`              | Actualizar rol               |
| `DELETE` | `/auth/roles/:name`              | Eliminar rol                 |
| `PATCH`  | `/auth/activate/roles/:name`     | Activar rol                  |
| `PATCH`  | `/auth/deactivate/roles/:name`   | Desactivar rol               |
| `POST`   | `/auth/assign/roles`             | Asignar roles a usuario      |
| `POST`   | `/auth/revoke/roles`             | Revocar roles de usuario     |
| `POST`   | `/auth/check/roles`              | Verificar roles de usuario   |

#### CRUD de permisos (requiere permisos `ReadPermissions`, `CreatePermissions`, etc.)

| Metodo   | Ruta                              | Descripcion                     |
|----------|-----------------------------------|---------------------------------|
| `GET`    | `/auth/permissions`               | Listar permisos                 |
| `POST`   | `/auth/permissions`               | Crear permiso                   |
| `GET`    | `/auth/permissions/:name`         | Obtener por nombre              |
| `PUT`    | `/auth/permissions/:name`         | Actualizar permiso              |
| `DELETE` | `/auth/permissions/:name`         | Eliminar permiso                |
| `POST`   | `/auth/assign/permissions`        | Asignar permisos a rol          |
| `POST`   | `/auth/revoke/permissions`        | Revocar permisos de rol         |
| `POST`   | `/auth/check/permissions`         | Verificar permisos de rol       |

## Arquitectura

```
src/
├── core/                    # Framework custom
│   ├── config/              # APP_NAME, PORT, VERSIONING
│   ├── container/           # Contenedor de DI (singleton, reflect-metadata)
│   ├── decorators/          # @Controller, @Get, @Post, @Inject, @Permissions, @Public...
│   ├── errors/              # Errores HTTP (HandleableError)
│   ├── handlers/            # RouteHandler: wraps auth + permissions check
│   ├── metadata/            # Reflect metadata keys
│   ├── middlewares/         # AuthMiddleware (JWT), ErrorMiddleware
│   ├── orm/                 # ORM custom: @Entity, @Column, @Id, relaciones, Database.sync()
│   ├── router/              # CoreRouter: auto-descubre controladores en src/
│   └── utils/               # Validator (required, email, strongPassword, etc.)
│
├── auth/                    # Modulo de identidad y acceso
    ├── constants/           # Constantes de permisos y roles
    ├── controllers/         # Auth, Authentication, Authorization, User, Role, Permission
    ├── dtos/                # UserDTO (excluye password)
    ├── entities/            # User, Role, Permission, BlockedToken
    ├── repositories/        # Acceso a datos por entidad
    └── services/            # Logica de negocio por entidad

└── schools/                 # Directorio público multi-colegio
    ├── controllers/         # Rutas públicas del directorio y perfil
    ├── dtos/                # Respuesta pública sin UUID ni auditoría
    ├── entities/            # School
    ├── repositories/        # Consultas de colegios publicables
    └── services/            # Reglas de publicación
```

## Scripts

| Comando         | Descripcion                         |
|-----------------|-------------------------------------|
| `pnpm run dev`   | Desarrollo con hot-reload (tsx)     |
| `pnpm run build` | Compila TypeScript a `dist/`        |
| `pnpm start`     | Ejecuta build de produccion         |
