# 👻 Ghost — Entorno de pruebas

> **Software III · Calidad y Pruebas de Software**
> Entorno local, reproducible y listo para usar para practicar **pruebas de frontend** y **automatización** (por ejemplo, con **Playwright**) sobre una aplicación web real: **[Ghost](https://ghost.org)**, una plataforma de código abierto para publicar blogs y newsletters.

Con un solo comando cada estudiante levanta en su ordenador:

- **Ghost 6.69.0** (versión fija: todo el curso prueba exactamente lo mismo),
- su base de datos **MySQL**,
- un **buzón de correo de pruebas** (Mailpit) donde llegan todos los correos de Ghost,
- un **visor de la base de datos** (Adminer),
- y **datos de prueba ya cargados**: un usuario por cada rol, miembros, posts, etiquetas y claves de API.

**No hay que configurar nada**: clonar, arrancar y empezar a probar.

---

## 📑 Índice

1. [Resumen rápido](#-resumen-rápido)
2. [Requisitos](#-requisitos)
3. [Instalación paso a paso](#-instalación-paso-a-paso)
4. [Servicios y puertos](#-servicios-y-puertos)
5. [Usuarios y credenciales de prueba](#-usuarios-y-credenciales-de-prueba)
6. [Formas de entrar a Ghost](#-formas-de-entrar-a-ghost)
7. [Formas de agregar usuarios](#-formas-de-agregar-usuarios)
8. [Verificación de dispositivo del staff (2FA por correo)](#-verificación-de-dispositivo-del-staff-2fa-por-correo)
9. [Volver al estado inicial (reset)](#-volver-al-estado-inicial-reset)
10. [Copias de seguridad](#-copias-de-seguridad)
11. [Preparar Playwright (Python)](#-preparar-playwright-python)
12. [Varias versiones o copias a la vez](#-varias-versiones-o-copias-a-la-vez)
13. [Comandos útiles](#-comandos-útiles)
14. [Estructura del proyecto](#-estructura-del-proyecto)
15. [Solución de problemas](#-solución-de-problemas)
16. [📝 Actividad 1: Conociendo Ghost](#-actividad-1-conociendo-ghost)

---

## ⚡ Resumen rápido

| Qué | Dónde |
|---|---|
| 🌐 Sitio público | **http://localhost:2368** |
| ⚙️ Panel de administración | **http://localhost:2368/ghost** |
| ✉️ Buzón de correo (Mailpit) | **http://localhost:8025** |
| 🗄️ Base de datos (Adminer) | **http://localhost:8082** |
| 🔑 Usuario principal | `owner@ghost.test` / `Calidad.2026*Qa` |

| Acción | Windows | macOS / Linux |
|---|---|---|
| Arrancar | doble clic en `iniciar.bat` | `./iniciar.sh` |
| Detener (conserva los datos) | `detener.bat` | `./detener.sh` |
| **Volver al estado inicial** | `reset.bat` | `./reset.sh` |
| Copia de seguridad | `backup.bat` | `./backup.sh` |

---

## 🧰 Requisitos

Solo **Docker**. No hace falta instalar Node.js, MySQL ni nada más.

| Sistema | Qué instalar |
|---|---|
| **Windows 10/11** | [Docker Desktop](https://www.docker.com/products/docker-desktop/) (usa WSL 2; el instalador lo configura) |
| **macOS** | [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Intel o Apple Silicon) |
| **Linux** | Docker Engine + plugin **Docker Compose v2** (`docker compose`) |

- **Internet la primera vez**, para descargar unos 1,5 GB de imágenes. Después funciona sin conexión.
- Unos **3 GB libres** en disco.
- Puertos **2368, 8025 y 8082** libres. Si alguno está ocupado, ver [Varias versiones o copias a la vez](#-varias-versiones-o-copias-a-la-vez).

Comprueba que Docker funciona:

```bash
docker --version
```

```bash
docker compose version
```

---

## 🚀 Instalación paso a paso

1. **Abre Docker Desktop** y espera a que indique *Engine running*.
2. **Descarga el repositorio**, con Git:
   ```bash
   git clone https://github.com/japago25andes/ghost_blog.git
   ```
   O sin Git: en GitHub, botón **Code → Download ZIP**, y descomprímelo.
3. **Arranca el entorno:**
   - **Windows:** entra en la carpeta y haz doble clic en **`iniciar.bat`**.
   - **macOS / Linux:**
     ```bash
     cd ghost_blog
     chmod +x *.sh   # solo la primera vez
     ./iniciar.sh
     ```
4. La **primera vez** tarda unos minutos (descarga de imágenes). Al terminar verás algo así:
   ```
   Configurando Ghost en http://localhost:2368 ...
     ✔ Owner creado: owner@ghost.test
     ✔ Administrator admin@ghost.test
     ✔ Super Editor  supereditor@ghost.test
     ✔ Editor        editor@ghost.test
     ✔ Author        autor@ghost.test
     ✔ Contributor   colaborador@ghost.test
     ✔ 5 miembros creados
     ✔ 4 posts, 1 página y 3 etiquetas
     ✔ Integración "Pruebas automatizadas"
   ```
5. En Windows se abre solo el navegador en **http://localhost:2368/ghost**. Entra con `owner@ghost.test` / `Calidad.2026*Qa`.

> 💡 También funciona solo con Docker, sin los scripts: `docker compose up -d`. El servicio `seed` carga los datos de prueba automáticamente.

### ¿Qué pasa por dentro?

1. Arranca **MySQL** y espera a que esté sano (*healthcheck*).
2. Arrancan **Mailpit** y **Adminer**.
3. Arranca **Ghost**, conectado a MySQL y enviando todo su correo a Mailpit.
4. Cuando Ghost está listo, el contenedor **`seed`** ejecuta [`seed/seed.mjs`](seed/seed.mjs):
   - crea el **Owner** con la API de configuración inicial;
   - **invita** a un usuario por cada rol de staff, **lee la invitación en Mailpit** y **la acepta**, igual que lo haría una persona;
   - crea **miembros**, **posts**, una **página**, **etiquetas** y una **integración** con claves de API.
5. Las siguientes veces, el seeder detecta que Ghost ya está configurado y **no toca nada**: respeta lo que hayan creado o borrado tus pruebas. Para volver al estado inicial, usa [reset](#-volver-al-estado-inicial-reset).

---

## 🔌 Servicios y puertos

| Servicio | Contenedor | URL / puerto | Para qué |
|---|---|---|---|
| **Ghost** | `ghost-blog-ghost-1` | http://localhost:2368 | Sitio público, panel de administración y APIs |
| **Mailpit** | `ghost-blog-mailpit-1` | http://localhost:8025 | Ver los correos que envía Ghost (invitaciones, códigos, enlaces de acceso…) |
| **Adminer** | `ghost-blog-adminer-1` | http://localhost:8082 | Consultar la base de datos desde el navegador |
| **MySQL** | `ghost-blog-db-1` | (solo dentro de Docker) | Base de datos de Ghost |
| **Seed** | `ghost-blog-seed-1` | — | Se ejecuta, carga los datos de prueba y termina |

Todas las versiones, puertos y credenciales están en el archivo **[`.env`](.env)**.

---

## 👥 Usuarios y credenciales de prueba

> 🔐 **Contraseña de todas las cuentas de staff: `Calidad.2026*Qa`**. Son credenciales de prueba de un entorno local; por eso están en el repositorio.

### Staff (entran al panel `/ghost`)

| Rol | Nombre | Correo | Qué puede hacer |
|---|---|---|---|
| **Owner** | Olga Owner | `owner@ghost.test` | Todo, incluido transferir la propiedad del sitio. Solo hay uno |
| **Administrator** | Ana Administradora | `admin@ghost.test` | Todo: ajustes, integraciones, staff, miembros y contenido |
| **Super Editor** | Sergio Supereditor | `supereditor@ghost.test` | Lo mismo que un Editor y, además, gestionar miembros |
| **Editor** | Eduardo Editor | `editor@ghost.test` | Publicar y editar todos los posts y etiquetas; invitar y gestionar Authors y Contributors |
| **Author** | Aurora Autora | `autor@ghost.test` | Crear, editar y **publicar sus propios** posts |
| **Contributor** | Carlos Colaborador | `colaborador@ghost.test` | Escribir y editar **sus propios borradores**; **no puede publicar** |

> Cada rol ve un menú distinto en el panel. Esto es ideal para pruebas de **permisos y autorización**: por ejemplo, comprobar que un Contributor no puede publicar, o que un Editor no ve la sección *Members* y un Super Editor sí. La descripción exacta de cada rol está en el panel: *Settings → Staff*.

### Miembros (lectores del sitio público)

Los miembros **no tienen contraseña**: entran con un **enlace o código que llega por correo** (a Mailpit).

| Nombre | Correo | Etiquetas |
|---|---|---|
| Miguel Miembro | `miembro1@ghost.test` | estudiante |
| Marta Miembro | `miembro2@ghost.test` | estudiante |
| Mario Miembro | `miembro3@ghost.test` | vip |
| Mónica Miembro | `miembro4@ghost.test` | vip, estudiante |
| Matías Miembro | `miembro5@ghost.test` | — (con una nota) |

### Contenido de prueba

| Tipo | Título | Estado |
|---|---|---|
| Post | Bienvenidos al entorno de pruebas | Publicado, destacado |
| Post | Qué es una prueba de extremo a extremo | Publicado |
| Post | Calidad de software en la práctica | Publicado |
| Post | Borrador de ejemplo | Borrador |
| Post | Coming soon | Publicado (lo crea Ghost por defecto) |
| Página | Acerca del entorno | Publicada |
| Página | About this site | Publicada (la crea Ghost por defecto) |
| Etiquetas | Pruebas, Calidad, Automatización | — |
| Etiqueta | News | Creada por Ghost por defecto |

### Claves de API

El seeder crea la integración **"Pruebas automatizadas"**. Sus claves **cambian en cada instalación o reset**. Para verlas:

- En el panel: **Settings → Integrations → Pruebas automatizadas**.
- O en la salida de `iniciar.bat` / `iniciar.sh` justo después de un reset.

---

## 🚪 Formas de entrar a Ghost

### 1. Sitio público — `http://localhost:2368`

Lo que ve cualquier visitante: portada, posts (`/<slug>/`), etiquetas (`/tag/<slug>/`), autores (`/author/<slug>/`) y búsqueda.

### 2. Panel de administración (staff) — `http://localhost:2368/ghost`

| Ruta | Pantalla |
|---|---|
| `/ghost/#/signin` | Inicio de sesión del staff |
| Botón **Forgot?** en `/ghost/#/signin` | Recuperar contraseña: el enlace (`/ghost/#/reset/<token>/`) llega a **Mailpit** |
| `/ghost/#/signup/<token>/` | Aceptar una invitación (el enlace llega a **Mailpit**) |
| `/ghost/#/setup` | Configuración inicial (ya hecha por el seeder) |
| `/ghost/#/posts`, `/ghost/#/pages`, `/ghost/#/tags` | Contenido |
| `/ghost/#/members` | Miembros |
| `/ghost/#/settings` | Ajustes (staff, integraciones, diseño, idioma…) |

Entra con cualquier usuario de la [tabla de staff](#staff-entran-al-panel-ghost) y la contraseña `Calidad.2026*Qa`.

### 3. Portal de miembros (lectores)

Ghost muestra un portal emergente sobre el sitio público:

| URL | Pantalla |
|---|---|
| `http://localhost:2368/#/portal/signup` | Registro de un nuevo miembro |
| `http://localhost:2368/#/portal/signin` | Inicio de sesión de un miembro |
| `http://localhost:2368/#/portal/account` | Cuenta del miembro (ya conectado) |

Para entrar como miembro:

1. Abre `#/portal/signin` y escribe, por ejemplo, `miembro1@ghost.test`.
2. Ve a **Mailpit** (http://localhost:8025). Llega un correo *"Sign in to Ghost Pruebas"* con un **enlace** y un **código de 6 dígitos**.
3. Haz clic en el enlace o escribe el código en el portal.

### 4. Buzón de correo — Mailpit — `http://localhost:8025`

Todos los correos que envía Ghost llegan aquí; **ninguno sale a internet**: invitaciones de staff, recuperación de contraseña, enlaces y códigos de miembros, y códigos de verificación de dispositivo.

Mailpit tiene una **API REST**, muy útil para que una prueba automatizada lea el código o el enlace de un correo:

| Petición | Qué devuelve |
|---|---|
| `GET http://localhost:8025/api/v1/messages` | Lista de correos |
| `GET http://localhost:8025/api/v1/search?query=to:miembro1@ghost.test` | Correos enviados a una dirección |
| `GET http://localhost:8025/api/v1/message/<ID>` | Contenido completo (texto y HTML) |
| `DELETE http://localhost:8025/api/v1/messages` | Vaciar el buzón |

### 5. Content API (lectura pública)

```
GET http://localhost:2368/ghost/api/content/posts/?key=<CONTENT_API_KEY>
```

Recursos: `posts`, `pages`, `tags`, `authors`, `tiers`, `settings`. Documentación: https://ghost.org/docs/content-api/

### 6. Admin API (gestión)

Hay dos formas de autenticarse:

- **Con la Admin API key** (`id:secreto`): se genera un **JWT** firmado con HS256 y se envía como `Authorization: Ghost <token>`. Documentación: https://ghost.org/docs/admin-api/
- **Con sesión de usuario**: `POST http://localhost:2368/ghost/api/admin/session/` con `{"username": "...", "password": "..."}` y la cabecera `Origin: http://localhost:2368`. Se recibe una cookie de sesión. Así es como lo hace el seeder.

### 7. Base de datos — Adminer — `http://localhost:8082`

| Campo | Valor |
|---|---|
| Sistema | MySQL / MariaDB |
| Servidor | `db` |
| Usuario | `ghost` |
| Contraseña | `ghost_pruebas_db` |
| Base de datos | `ghost` |

Tablas útiles: `users`, `roles_users`, `members`, `posts`, `tags`, `invites`, `sessions`.

> Úsala para **comprobar** lo que guardan tus pruebas. Modificar datos a mano puede dejar Ghost en un estado incoherente; si pasa, haz un [reset](#-volver-al-estado-inicial-reset).

---

## ➕ Formas de agregar usuarios

### Administrador (Owner)

| Forma | Cómo |
|---|---|
| **Automática** (por defecto) | El seeder lo crea al arrancar por primera vez o tras un reset |
| Manual | En una instalación sin datos, abrir `/ghost/#/setup` y rellenar título del sitio, nombre, correo y contraseña (mínimo 10 caracteres) |
| Por API | `POST /ghost/api/admin/authentication/setup/` con `{"setup":[{"name","email","password","blogTitle"}]}` |

### Staff (Administrator, Super Editor, Editor, Author, Contributor)

| Forma | Pasos |
|---|---|
| **Invitar desde el panel** | 1. Entra como Owner o Administrator (un Editor solo puede invitar Authors y Contributors). 2. **Settings → Staff → Invite people**. 3. Escribe el correo y elige el rol. 4. Abre **Mailpit** y la invitación *"… has invited you to join"*. 5. Haz clic en el enlace, pon nombre y contraseña y pulsa **Create account** |
| **Por Admin API** | `POST /ghost/api/admin/invites/` con `{"invites":[{"email","role_id"}]}`. Los `role_id` se obtienen con `GET /ghost/api/admin/roles/?permissions=assign`. Para aceptar: `POST /ghost/api/admin/authentication/invitation/` con el token del enlace del correo |
| Cambiar el rol | **Settings → Staff →** (usuario) **→ Role** |
| Suspender o eliminar | **Settings → Staff →** (usuario) **→ ⋯** (*Suspend user* / *Delete user*) |
| Transferir la propiedad | Solo el Owner: **Settings → Staff →** (un Administrator) **→ ⋯ → Make owner** |

### Miembros (lectores)

| Forma | Pasos |
|---|---|
| **El propio lector** | Sitio público → **Subscribe** o `#/portal/signup` → nombre y correo → confirmar con el enlace o código que llega a **Mailpit** |
| **Desde el panel** | **Members → New member** → nombre, correo, etiquetas y nota → **Save**. No envía correo |
| **Importar CSV** | **Members → ⋯ → Import members** → subir un CSV (ejemplo abajo) |
| **Por Admin API** | `POST /ghost/api/admin/members/` con `{"members":[{"email","name","labels":[{"name":"vip"}]}]}` |

Ejemplo de CSV para importar miembros:

```csv
email,name,note,labels
nuevo1@ghost.test,Nuevo Uno,Importado por CSV,importado
nuevo2@ghost.test,Nuevo Dos,,importado
```

> ℹ️ Los miembros **de pago** necesitan conectar Stripe y **no están configurados** en este entorno. Los miembros gratuitos funcionan por completo.

---

## 🔐 Verificación de dispositivo del staff (2FA por correo)

Ghost 6 puede pedir un **código por correo** cuando un usuario del staff entra desde un navegador nuevo. Las herramientas de automatización abren siempre un navegador "nuevo", así que esa verificación bloquearía las pruebas de login. Por eso **viene desactivada**.

Para **activarla** y probar ese flujo:

1. En [`.env`](.env), cambia `STAFF_DEVICE_VERIFICATION=false` por `true`.
2. Aplica el cambio:
   ```bash
   docker compose up -d
   ```
3. Al iniciar sesión en `/ghost`, Ghost pedirá un código que llega a **Mailpit**.

Para volver a desactivarla, pon `false` y repite el paso 2.

---

## 🔄 Volver al estado inicial (reset)

Las pruebas crean, editan y borran datos. Para que sean **repetibles**, conviene empezar siempre desde el mismo estado:

- **Windows:** `reset.bat` (pide confirmación).
- **macOS / Linux:** `./reset.sh`
- Solo con Docker:
  ```bash
  docker compose down -v
  ```
  ```bash
  docker compose up -d
  ```

Esto **borra** posts, usuarios, miembros, imágenes y correos, y vuelve a cargar los datos de prueba. Tarda unos 30 segundos.

> ⚠️ Las **claves de API cambian** tras cada reset. Consúltalas de nuevo en *Settings → Integrations*.

---

## 💾 Copias de seguridad

`backup.bat` / `./backup.sh` guardan en la carpeta `backups/` (no se sube a GitHub):

| Archivo | Contenido |
|---|---|
| `ghost-db-AAAAMMDD-HHMM.sql` | Volcado completo de la base de datos |
| `ghost-content-AAAAMMDD-HHMM.tar.gz` | Imágenes, temas y archivos subidos |

**Restaurar** (con Ghost arrancado y cambiando la fecha por la de tu copia):

Windows (**Símbolo del sistema / cmd**, no PowerShell):

```bat
docker compose exec -T db sh -c "mysql -uroot -p\"$MYSQL_ROOT_PASSWORD\"" < backups\ghost-db-20261012-2117.sql
```

```bat
docker compose run --rm --no-deps -T -v "%cd%\backups:/backup" --entrypoint tar ghost xzf /backup/ghost-content-20261012-2117.tar.gz -C /var/lib/ghost/content
```

macOS / Linux:

```bash
docker compose exec -T db sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD"' < backups/ghost-db-20261012-2117.sql
```

```bash
docker compose run --rm --no-deps -T -v "$(pwd)/backups:/backup" --entrypoint tar ghost xzf /backup/ghost-content-20261012-2117.tar.gz -C /var/lib/ghost/content
```

Después, en cualquier sistema:

```bash
docker compose restart ghost
```

---

## 🎭 Preparar Playwright (Python)

Este repositorio **solo contiene el entorno**; las pruebas las escribe cada estudiante en su propio proyecto. Para preparar Playwright con Python (3.9 o superior):

```bash
pip install pytest-playwright
```

```bash
playwright install
```

Datos que necesitarás en tus pruebas:

| Dato | Valor |
|---|---|
| URL base | `http://localhost:2368` |
| Panel de administración | `http://localhost:2368/ghost/#/signin` |
| Usuarios y contraseña | ver [Usuarios y credenciales](#-usuarios-y-credenciales-de-prueba) |
| Correos (códigos, enlaces) | API de Mailpit: `http://localhost:8025/api/v1/...` |

Herramientas útiles de Playwright:

- **Grabar acciones y generar código:**
  ```bash
  playwright codegen http://localhost:2368/ghost
  ```
- **Ejecutar las pruebas con la URL base:**
  ```bash
  pytest --base-url http://localhost:2368
  ```
- **Ver la ejecución en el navegador:** añade `--headed`.

Consejos para Ghost:

- El panel `/ghost` es una aplicación de una sola página (SPA) con rutas tras `#/`. **Espera a que aparezcan los elementos** en lugar de usar pausas fijas.
- El panel incluye muchos atributos **`data-test-…`** y **`data-testid`** en sus elementos. Suelen ser los selectores más estables.
- El portal de miembros se abre dentro de un **iframe**.
- **Haz un reset antes de cada ejecución completa** para que las pruebas no dependan de datos de ejecuciones anteriores.

---

## 🧪 Varias versiones o copias a la vez

Todo lo configurable está en `.env`. Para levantar **otra copia** de este entorno a la vez (por ejemplo, con otra versión de Ghost para comparar), copia la carpeta y cambia en su `.env`:

```ini
COMPOSE_PROJECT_NAME=ghost-blog-b   # nombre distinto (evita mezclar contenedores y datos)
GHOST_VERSION=6.69.0                # la versión que quieras probar
GHOST_PORT=3001
GHOST_URL=http://localhost:3001     # mismo puerto que GHOST_PORT
MAILPIT_PORT=8026
ADMINER_PORT=8083
```

Las versiones disponibles de Ghost están en https://hub.docker.com/_/ghost/tags

---

## 🛠️ Comandos útiles

Desde la carpeta del proyecto:

| Comando | Para qué |
|---|---|
| `docker compose ps -a` | Estado de los servicios (`seed` aparece como *Exited (0)*: es normal) |
| `docker compose logs -f ghost` | Mensajes de Ghost en directo (`Ctrl + C` para salir) |
| `docker compose logs seed` | Resultado de la última carga de datos |
| `docker compose restart ghost` | Reiniciar solo Ghost |
| `docker compose up -d` | Aplicar cambios del `.env` |
| `docker compose down` | Detener (conserva los datos) |
| `docker compose down -v` | Detener **y borrar todos los datos** |

---

## 🗂️ Estructura del proyecto

```
ghost_blog/
├── .env                 ← versiones, puertos y credenciales de prueba (se sube a propósito)
├── docker-compose.yml   ← servicios: ghost, db, mailpit, adminer y seed
├── seed/
│   └── seed.mjs         ← carga los datos de prueba (usuarios, miembros, posts, integración)
├── iniciar.bat / iniciar.sh   ← arrancar
├── detener.bat / detener.sh   ← detener (conserva datos)
├── reset.bat   / reset.sh     ← volver al estado inicial
├── backup.bat  / backup.sh    ← copia de seguridad en backups/
└── README.md
```

---

## 🩺 Solución de problemas

| Problema | Causa probable | Solución |
|---|---|---|
| *"No se pudo arrancar"* o `failed to connect to the docker API` | Docker Desktop no está abierto | Ábrelo, espera a *Engine running* y repite |
| `port is already allocated` | Otro programa usa 2368, 8025 u 8082 | Cambia los puertos en `.env` (ver [Varias versiones o copias a la vez](#-varias-versiones-o-copias-a-la-vez)) |
| El seeder muestra `ERROR` | Algo falló a mitad de la carga | Haz un [reset](#-volver-al-estado-inicial-reset) |
| No puedo iniciar sesión: *"Too many login attempts"* | Ghost bloquea temporalmente tras varios intentos fallidos (protección contra fuerza bruta) | Espera unos minutos o haz un reset |
| Ghost pide un código al iniciar sesión | `STAFF_DEVICE_VERIFICATION=true` | Busca el código en Mailpit o pon `false` en `.env` y ejecuta `docker compose up -d` |
| No llegan correos | Se buscan en un correo real | Todos los correos están en **http://localhost:8025** |
| El navegador salta a otra dirección | `GHOST_URL` no coincide con `GHOST_PORT` | Corrige `.env` y ejecuta `docker compose up -d` |
| Las claves de API ya no funcionan | Se hizo un reset | Consulta las nuevas en *Settings → Integrations* |
| En macOS/Linux: `permission denied` al ejecutar un `.sh` | Falta el permiso de ejecución | `chmod +x *.sh` |
| En los registros: *"Traffic Analytics service is not configured"* | Servicio opcional de Ghost 6 | Es normal; no afecta |

---

## 📝 Actividad 1: Conociendo Ghost

**Objetivo:** familiarizarte con la aplicación antes de probarla. No se puede probar bien lo que no se conoce: entender **para qué sirve**, **quién la usa** y **cómo funciona** es el primer paso para diseñar buenas pruebas.

- **Modalidad:** individual.
- **Entrega:** **a mano**, en papel.

> 💡 Puedes crear, editar y borrar todo lo que quieras mientras exploras. Al terminar, ejecuta `reset.bat` / `./reset.sh` y todo vuelve al estado inicial.

### Parte 1. ¿Qué es Ghost?

1. ¿Qué es Ghost y para qué está hecho? Explícalo con tus palabras.
2. ¿Cuál es su objetivo principal? ¿Qué problema resuelve y a quién?
3. ¿Quiénes son sus usuarios? Identifica al menos tres tipos de personas que interactúan con la aplicación.
4. ¿Ghost es software libre o comercial? ¿Qué implica que sea de código abierto?
5. Menciona dos aplicaciones similares a Ghost y una diferencia importante con cada una.

### Parte 2. Recorrido como visitante (sin iniciar sesión)

6. Recorre el sitio público (http://localhost:2368). ¿Qué secciones y elementos encontraste?
7. ¿Qué puede hacer un visitante sin registrarse?
8. ¿Funciona la búsqueda? ¿Qué pasa si buscas un texto que no existe?

### Parte 3. Recorrido como miembro (lector)

9. Inicia sesión como `miembro1@ghost.test` desde el portal. Describe el proceso paso a paso. ¿Por qué no hay contraseña?
10. ¿Qué correo recibiste en Mailpit (http://localhost:8025)? ¿Qué dos formas de acceso ofrece?
11. Registra un miembro nuevo con un correo inventado. ¿Qué pasos seguiste y qué viste en Mailpit?
12. ¿Qué puede hacer un miembro que no puede hacer un visitante?

### Parte 4. Recorrido por los roles del staff

13. Inicia sesión en http://localhost:2368/ghost con cada usuario del staff (ver [Usuarios y credenciales](#-usuarios-y-credenciales-de-prueba)) y completa la tabla con **Sí** o **No**:

| Acción | Owner | Administrator | Super Editor | Editor | Author | Contributor |
|---|---|---|---|---|---|---|
| Crear un post | | | | | | |
| Publicar un post | | | | | | |
| Editar posts de otros | | | | | | |
| Ver y gestionar miembros | | | | | | |
| Invitar staff | | | | | | |
| Cambiar ajustes del sitio | | | | | | |
| Crear etiquetas | | | | | | |

14. ¿Qué diferencias de menú y de opciones encontraste entre los roles? Descríbelas.
15. ¿Por qué crees que existen tantos roles? ¿Qué riesgo habría si un Contributor pudiera publicar?

### Parte 5. Funcionalidades principales

16. Como Owner, crea un post con título, texto, una imagen y una etiqueta. Publícalo y comprueba que aparece en el sitio público. Describe los pasos que seguiste.
17. Haz un inventario de las funcionalidades principales de Ghost (por ejemplo: posts, páginas, etiquetas, miembros, staff, newsletters, diseño, integraciones…). Para cada una, explica en una línea para qué sirve.
18. ¿Qué tres funcionalidades te parecen **más importantes** para el negocio? ¿Por qué?

### Parte 6. Mirada de calidad

19. ¿Qué funcionalidades consideras **más críticas**, es decir, cuáles causarían más daño si fallaran? Justifica tu respuesta.
20. Propón **5 escenarios de prueba** con este formato:

| # | Funcionalidad | Escenario | Pasos | Resultado esperado |
|---|---|---|---|---|
| 1 | Inicio de sesión | Login con contraseña incorrecta | … | … |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |

21. ¿Encontraste algún **comportamiento extraño, error o algo confuso** para el usuario? Descríbelo con los pasos para reproducirlo.
22. Además de que "funcione", ¿qué otros aspectos de calidad observaste? Por ejemplo: rapidez, facilidad de uso, claridad de los mensajes de error, apariencia en distintos tamaños de pantalla o accesibilidad.
23. ¿Qué partes de Ghost automatizarías primero con Playwright y por qué?

### Parte 7. Reflexión

24. ¿Qué fue lo que más te llamó la atención de la aplicación?
25. ¿Qué te resultó más difícil de entender o de usar?
