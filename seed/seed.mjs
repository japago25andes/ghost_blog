// Seeder del entorno de pruebas de Ghost.
//
// Se ejecuta en el contenedor "seed" cada vez que se hace `docker compose up`.
// - Si Ghost aún no está configurado: crea el Owner, un usuario por cada rol de
//   staff (aceptando la invitación real que llega a Mailpit), miembros y posts.
// - Si Ghost ya está configurado: no toca nada (respeta lo que hayan hecho las pruebas).
//
// Solo usa Node.js (fetch nativo), sin dependencias.

const BASE = 'http://localhost:2368'; // el contenedor comparte la red de Ghost
const ORIGIN = (process.env.GHOST_URL || 'http://localhost:2368').replace(/\/$/, '');
const MAILPIT = process.env.MAILPIT_URL || 'http://mailpit:8025';
const PASSWORD = process.env.TEST_PASSWORD;
const SITE_TITLE = process.env.SITE_TITLE || 'Ghost Pruebas';
const API = `${BASE}/ghost/api/admin`;

const OWNER = { name: 'Olga Owner', email: 'owner@ghost.test' };

// Un usuario por rol de staff. "Super Editor" solo se crea si la versión de Ghost tiene ese rol.
const STAFF = [
  { role: 'Administrator', name: 'Ana Administradora', email: 'admin@ghost.test' },
  { role: 'Super Editor', name: 'Sergio Supereditor', email: 'supereditor@ghost.test' },
  { role: 'Editor', name: 'Eduardo Editor', email: 'editor@ghost.test' },
  { role: 'Author', name: 'Aurora Autora', email: 'autor@ghost.test' },
  { role: 'Contributor', name: 'Carlos Colaborador', email: 'colaborador@ghost.test' },
];

const MEMBERS = [
  { name: 'Miguel Miembro', email: 'miembro1@ghost.test', labels: ['estudiante'] },
  { name: 'Marta Miembro', email: 'miembro2@ghost.test', labels: ['estudiante'] },
  { name: 'Mario Miembro', email: 'miembro3@ghost.test', labels: ['vip'] },
  { name: 'Mónica Miembro', email: 'miembro4@ghost.test', labels: ['vip', 'estudiante'] },
  { name: 'Matías Miembro', email: 'miembro5@ghost.test', labels: [], note: 'Miembro sin etiquetas' },
];

const TAGS = ['Pruebas', 'Calidad', 'Automatización'];

const POSTS = [
  {
    title: 'Bienvenidos al entorno de pruebas',
    html: '<p>Este sitio es un entorno local para practicar <strong>pruebas de frontend</strong> y automatización.</p><p>Puedes crear, editar y borrar contenido sin miedo: con el script de reinicio vuelve a su estado inicial.</p>',
    tags: ['Pruebas'],
    featured: true,
    status: 'published',
  },
  {
    title: 'Qué es una prueba de extremo a extremo',
    html: '<p>Una prueba E2E recorre la aplicación como lo haría una persona: abre páginas, hace clic, escribe y comprueba lo que ve.</p>',
    tags: ['Pruebas', 'Automatización'],
    status: 'published',
  },
  {
    title: 'Calidad de software en la práctica',
    html: '<p>La calidad no se añade al final: se construye con revisiones, pruebas y automatización desde el principio.</p>',
    tags: ['Calidad'],
    status: 'published',
  },
  {
    title: 'Borrador de ejemplo',
    html: '<p>Este post está en borrador: no aparece en el sitio público.</p>',
    tags: ['Pruebas'],
    status: 'draft',
  },
];

const PAGES = [
  {
    title: 'Acerca del entorno',
    html: '<p>Página estática de ejemplo creada por el seeder.</p>',
    status: 'published',
  },
];

// ─────────────────────────────── utilidades ───────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let cookie = '';

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(API + path, {
    method,
    redirect: 'manual',
    headers: {
      'Content-Type': 'application/json',
      Origin: ORIGIN,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = text;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // respuesta no JSON
  }
  if (!res.ok) {
    const err = new Error(`${method} ${path} -> ${res.status} ${text.slice(0, 400)}`);
    err.status = res.status;
    throw err;
  }
  return { data, res };
}

async function waitForGhost() {
  for (let i = 0; i < 120; i++) {
    try {
      const { data } = await api('/authentication/setup/');
      return data.setup[0].status;
    } catch {
      await sleep(2000);
    }
  }
  throw new Error('Ghost no respondió a tiempo');
}

async function login(email) {
  const { res } = await api('/session/', { method: 'POST', body: { username: email, password: PASSWORD } });
  const setCookies = res.headers.getSetCookie?.() || [];
  cookie = setCookies.map((c) => c.split(';')[0]).join('; ');
  if (!cookie) throw new Error('No se recibió la cookie de sesión');
}

// Busca en Mailpit el último correo enviado a `to` y devuelve su contenido.
async function waitForEmail(to, after) {
  for (let i = 0; i < 40; i++) {
    const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`);
    const { messages = [] } = await res.json();
    const msg = messages.find((m) => new Date(m.Created) >= after);
    if (msg) {
      const full = await (await fetch(`${MAILPIT}/api/v1/message/${msg.ID}`)).json();
      return `${full.Text || ''}\n${full.HTML || ''}`;
    }
    await sleep(500);
  }
  throw new Error(`No llegó a Mailpit el correo para ${to}`);
}

// ─────────────────────────────── pasos ───────────────────────────────

async function setupOwner() {
  await api('/authentication/setup/', {
    method: 'POST',
    body: { setup: [{ name: OWNER.name, email: OWNER.email, password: PASSWORD, blogTitle: SITE_TITLE }] },
  });
  console.log(`  ✔ Owner creado: ${OWNER.email}`);
}

async function createStaff() {
  const { data } = await api('/roles/?permissions=assign&limit=all');
  const roles = Object.fromEntries(data.roles.map((r) => [r.name, r.id]));
  console.log(`  · Roles disponibles en esta versión: ${Object.keys(roles).join(', ')}`);

  for (const user of STAFF) {
    const roleId = roles[user.role];
    if (!roleId) {
      console.log(`  - Rol "${user.role}" no existe en esta versión: se omite ${user.email}`);
      continue;
    }
    const sentAt = new Date(Date.now() - 1000);
    await api('/invites/', { method: 'POST', body: { invites: [{ email: user.email, role_id: roleId }] } });

    // La invitación llega a Mailpit con un enlace .../ghost/#/signup/<token>/
    const mail = await waitForEmail(user.email, sentAt);
    const match = mail.match(/signup\/([^/\s"'<>]+)\/?/);
    if (!match) throw new Error(`No se encontró el enlace de invitación para ${user.email}`);

    await api('/authentication/invitation/', {
      method: 'POST',
      body: { invitation: [{ token: match[1], email: user.email, name: user.name, password: PASSWORD }] },
    });
    console.log(`  ✔ ${user.role.padEnd(13)} ${user.email}`);
  }
}

async function createMembers() {
  for (const m of MEMBERS) {
    await api('/members/?send_email=false', {
      method: 'POST',
      body: { members: [{ name: m.name, email: m.email, note: m.note, labels: m.labels.map((name) => ({ name })) }] },
    });
  }
  console.log(`  ✔ ${MEMBERS.length} miembros creados`);
}

async function createContent() {
  for (const p of POSTS) {
    await api('/posts/?source=html', {
      method: 'POST',
      body: { posts: [{ ...p, tags: p.tags.map((name) => ({ name })) }] },
    });
  }
  for (const p of PAGES) {
    await api('/pages/?source=html', { method: 'POST', body: { pages: [p] } });
  }
  console.log(`  ✔ ${POSTS.length} posts, ${PAGES.length} página y ${TAGS.length} etiquetas`);
}

// Integración personalizada: da las claves de la Content API y de la Admin API.
async function createIntegration() {
  const { data } = await api('/integrations/?include=api_keys', {
    method: 'POST',
    body: { integrations: [{ name: 'Pruebas automatizadas', description: 'Creada por el seeder para probar las APIs' }] },
  });
  const keys = Object.fromEntries(data.integrations[0].api_keys.map((k) => [k.type, k]));
  console.log('  ✔ Integración "Pruebas automatizadas"');
  console.log(`      Content API key: ${keys.content.secret}`);
  // Formato "id:secreto" (algunas versiones ya devuelven el secreto con el id delante)
  const adminKey = keys.admin.secret.includes(':') ? keys.admin.secret : `${keys.admin.id}:${keys.admin.secret}`;
  console.log(`      Admin API key:   ${adminKey}`);
}

// ─────────────────────────────── main ───────────────────────────────

const configured = await waitForGhost();
if (configured) {
  console.log('Ghost ya estaba configurado: el seeder no cambia nada.');
  console.log('Para volver al estado inicial usa reset.bat (o reset.sh).');
  process.exit(0);
}

try {
  console.log(`Configurando Ghost en ${ORIGIN} ...`);
  await setupOwner();
  await login(OWNER.email);
  await createStaff();
  await createMembers();
  await createContent();
  await createIntegration();
  console.log('');
  console.log('Listo. Todas las cuentas de staff usan la contraseña:', PASSWORD);
  console.log(`  Sitio:          ${ORIGIN}/`);
  console.log(`  Administración: ${ORIGIN}/ghost/`);
} catch (err) {
  console.error('\nERROR durante la carga de datos de prueba:');
  console.error(err.message);
  console.error('Ejecuta reset.bat (o reset.sh) para empezar de cero.');
  process.exit(1);
}
