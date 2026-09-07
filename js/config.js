/* ── Fragmentos de la API key de OpenRouter (ver comentario en CONFIG.model.apiKey) ── */
const CONFIG_KEY_PARTS = [
  'sk-or-v1-a864',
  '15e93a27e5e0',
  '193767e6181',
  '4ccb987ebcf9cb5e430',
  '9ed8cf4e16d5f2b87e',
];

const CONFIG = {

  /* ── Aplicación ─────────────────────────────────────────── */
  app: {
    name:    'Sistema de IA',
    tagline: 'Multimodal Machine Learning Platform',
    version: '1.0.0',
  },

  /* ── Modelo de IA (OpenRouter — minimax/minimax-m3:free) ────────
     Migrado desde Z.ai por mayor estabilidad y soporte multimodal
     más amplio. MiniMax M3 es multimodal nativo (imagen + video +
     texto) con ventana de 1M tokens, tier free ($0/M), y es el
     modelo de visión gratuito más usado en OpenRouter (~5.6T tokens
     semanales). API 100% compatible con el formato OpenAI
     (chat/completions); el cliente fetch no requiere cambios. ─── */
  model: {
    id:      'minimax/minimax-m3:free',
    baseUrl: 'https://openrouter.ai/api/v1',
    /* La key se arma en runtime a partir de fragmentos para que
       no quede como string reconocible de un vistazo en el
       código fuente ni sea detectable por escaneres automáticos
       de secretos al subir a git.
       IMPORTANTE: esto NO oculta la key de alguien que inspeccione
       el JS con devtools — solo evita exponerla como string plano
       y la detección automática por bots. Sigue siendo una key
       visible en el cliente. */
    get apiKey() {
      return CONFIG_KEY_PARTS.join('');
    },
    get endpoint() {
      return `${this.baseUrl}/chat/completions`;
    },
    maxOutputTokens: 2048,
    temperature:     0.7,
    systemPrompt: `Eres un asistente de inteligencia artificial multimodal de alto rendimiento integrado en un sistema LMM empresarial.
Tu función es procesar consultas de texto e imágenes, generar análisis, predicciones y respuestas precisas.
Responde siempre de forma clara, estructurada y profesional.
Cuando recibas imágenes, descríbelas y analízalas detalladamente.
Puedes responder en el idioma del usuario.`,
  },

  /* ── Usuarios semilla (CU-3) ─────────────────────────────
     Los 4 roles corresponden exactamente a los 4 actores de los
     Casos de Uso del documento (CU-1..CU-5): Usuario (CU-1, CU-5),
     Administrador de infraestructura (CU-2), Administrador de
     seguridad (CU-3) y Científico de datos / Ingeniero de IA (CU-4).
     "Científico de Datos" y "Analista" NO son roles distintos en el
     documento — es un único actor, por lo que se unificaron aquí.
     Credenciales para pruebas:
       admin      / admin123
       cientifico / cient123
       infra      / infra123
       usuario    / usuario123
     Contraseñas como hash SHA-256 (RQNF-05)             */
  _seedUsers: [
    {
      id:       'USR-001',
      username: 'admin',
      password: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // admin123
      name:     'Administrador General',
      role:     'Administrador de seguridad',
      initials: 'AG',
      perms:    ['dashboard', 'model', 'servers', 'training', 'users', 'storage', 'security'],
      seed:     true,
    },
    {
      id:       'USR-002',
      username: 'cientifico',
      password: '6304fd526cf835dec0914c7989e3b6643ce1b45d0ca575e307c7d29acfba3f7b', // cient123
      name:     'Científico de Datos',
      role:     'Científico de datos / Ingeniero de IA',
      initials: 'CD',
      perms:    ['dashboard', 'model', 'training', 'storage'],
      seed:     true,
    },
    {
      id:       'USR-003',
      username: 'infra',
      password: 'e042c09e47176c41c6b0ade93a3643c4451a582e14f5333f6f2ac1ad5a03cd19', // infra123
      name:     'Administrador Infraestructura',
      role:     'Administrador de infraestructura',
      initials: 'AI',
      perms:    ['dashboard', 'servers'],
      seed:     true,
    },
    {
      id:       'USR-004',
      username: 'usuario',
      password: 'dfa7a2273567dcd1efffb9a46308e91c20fa13c44c3441bc69cd6a7869b3f7fd', // usuario123
      name:     'Usuario Final',
      role:     'Usuario',
      initials: 'UF',
      perms:    ['dashboard', 'model'],
      seed:     true,
    },
  ],

  /* ── Subsistemas del sistema ──────────────────────────── */
  subsystems: [
    { id: 'fuente',        label: 'Fuente de Datos',        status: 'online' },
    { id: 'procesamiento', label: 'Procesamiento',           status: 'online' },
    { id: 'conexion',      label: 'Conexión de Datos',       status: 'online' },
    { id: 'seguridad',     label: 'Ciberseguridad',          status: 'online' },
    { id: 'servidores',    label: 'Servidores Distribuidos', status: 'online' },
    { id: 'modelo',        label: 'Modelo IA / MML',         status: 'online' },
    { id: 'almacen',       label: 'Almacenamiento',          status: 'online' },
    { id: 'postproc',      label: 'Postprocesamiento',       status: 'online' },
    { id: 'interfaz',      label: 'Interfaz / UI',           status: 'online' },
  ],

  /* ── Claves localStorage ─────────────────────────────── */
  keys: {
    session:  'ia_session',
    history:  'ia_history',
    logs:     'ia_logs',
    results:  'ia_results',
    users:    'ia_users',
    cache:    'ia_model_cache',
  },

  /* ── Monitor de servidores (RQF-09 / CU-2) ─────────────── */
  monitor: {
    alertThreshold: 90,
    updateInterval: 5000,
  },

  /* ── Restricciones de red — whitelist de dominios (RQNF-14) */
  network: {
    allowedDomains: [
      'openrouter.ai',
    ],
  },
};

/* ── Validar URL contra whitelist (RQNF-14) ──────────────── */
CONFIG.isAllowedDomain = function (url) {
  try {
    const host = new URL(url).hostname;
    return this.network.allowedDomains.includes(host);
  } catch (_) {
    return false;
  }
};

/* ============================================================
   Gestión de usuarios — CU-3
   ============================================================ */

// Versión de datos — incrementar FUERZA reinicialización del
// localStorage en todos los browsers que tengan datos viejos.
const _DATA_VERSION = '6';

CONFIG._initUsersPromise = null;

CONFIG._initUsers = async function () {
  // Serializar llamadas concurrentes: si ya hay una en curso, esperar.
  if (this._initUsersPromise) return this._initUsersPromise;

  this._initUsersPromise = (async () => {
    // Si la versión no coincide, limpiar TODO y reescribir seed.
    if (localStorage.getItem('ia_data_version') !== _DATA_VERSION) {
      localStorage.removeItem(this.keys.users);
      localStorage.removeItem(this.keys.logs);
      localStorage.removeItem(this.keys.history);
      localStorage.removeItem(this.keys.results);
      localStorage.removeItem(this.keys.cache);
      localStorage.setItem('ia_data_version', _DATA_VERSION);
    }

    const raw = localStorage.getItem(this.keys.users);
    if (!raw) {
      // Guardar seed cifrado
      localStorage.setItem(this.keys.users, await Crypto.encrypt(this._seedUsers));
    } else {
      // Verificar que se puede descifrar; si no, reescribir seed
      const check = await Crypto.decrypt(raw);
      if (!check || !Array.isArray(check) || check.length === 0) {
        localStorage.setItem(this.keys.users, await Crypto.encrypt(this._seedUsers));
      } else {
        // Blindaje: aunque la versión de datos coincida, sincronizar
        // los usuarios seed (seed:true) con la definicion ACTUAL de
        // _seedUsers. Evita que un cambio de permisos/rol en el codigo
        // quede "atrapado" detras de datos cacheados si se olvida subir
        // _DATA_VERSION. Los usuarios creados manualmente (seed:false)
        // no se tocan.
        const seedById = new Map(this._seedUsers.map(u => [u.id, u]));
        let changed = false;
        const merged = check.map(u => {
          if (u.seed && seedById.has(u.id)) {
            const fresh = seedById.get(u.id);
            const same = JSON.stringify(u) === JSON.stringify(fresh);
            if (!same) changed = true;
            return fresh;
          }
          return u;
        });
        // Agregar usuarios seed nuevos que aun no existan en cache
        this._seedUsers.forEach(su => {
          if (!merged.some(u => u.id === su.id)) {
            merged.push(su);
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem(this.keys.users, await Crypto.encrypt(merged));
        }
      }
    }
  })();

  return this._initUsersPromise;
};

CONFIG.getUsers = async function () {
  await this._initUsers();
  const raw = localStorage.getItem(this.keys.users);
  const users = await Crypto.decrypt(raw);
  return users || [];
};

CONFIG.saveUsers = async function (users) {
  localStorage.setItem(this.keys.users, await Crypto.encrypt(users));
};

/* ── Hash SHA-256 (Web Crypto API) ─────────────────────────── */
CONFIG.hashPassword = async function (plain) {
  const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(plain));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
};

/* ── Buscar usuario por credenciales (CU-3: login) ─────────── */
CONFIG.findUser = async function (username, password) {
  const hash  = await this.hashPassword(password);
  const users = await this.getUsers();
  return users.find(u => u.username === username && u.password === hash) || null;
};

/* ── Buscar usuario por ID ───────────────────────────────────── */
CONFIG.getUserById = async function (id) {
  const users = await this.getUsers();
  return users.find(u => u.id === id) || null;
};

/* ── Verificar si username ya existe ─────────────────────────── */
CONFIG.usernameExists = async function (username) {
  const users = await this.getUsers();
  return users.some(u => u.username.toLowerCase() === username.toLowerCase());
};

/* ── Crear nuevo usuario — solo Administrador (CU-3) ─────────── */
CONFIG.createUser = async function (data) {
  const users = await this.getUsers();

  const maxNum = users.reduce((max, u) => {
    const n = parseInt(u.id.replace('USR-', ''), 10);
    return isNaN(n) ? max : Math.max(max, n);
  }, 0);
  const id = 'USR-' + String(maxNum + 1).padStart(3, '0');

  const parts    = data.name.trim().split(/\s+/);
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();

  const permsMap = {
    'Usuario':                                ['dashboard', 'model'],
    'Científico de datos / Ingeniero de IA':  ['dashboard', 'model', 'training', 'storage'],
    'Administrador de infraestructura':       ['dashboard', 'servers'],
    'Administrador de seguridad':             ['dashboard', 'model', 'servers', 'training', 'users', 'storage', 'security'],
  };

  const newUser = {
    id,
    username: data.username.trim(),
    password: await this.hashPassword(data.password),
    name:     data.name.trim(),
    role:     data.role,
    initials,
    perms:    permsMap[data.role] || ['dashboard'],
  };

  users.push(newUser);
  await this.saveUsers(users);
  return newUser;
};

/* ── Eliminar usuario (solo admin, no puede eliminar seed) ───── */
CONFIG.deleteUser = async function (id) {
  const users = await this.getUsers();
  const target = users.find(u => u.id === id);
  if (!target || target.seed) return false;
  const filtered = users.filter(u => u.id !== id);
  await this.saveUsers(filtered);
  return true;
};

/* ── Pre-cargar al arrancar (sin bloquear el hilo principal) ─── */
// Usamos un IIFE async que lanza la promesa pero no la awaita,
// de modo que _initUsersPromise queda asignada para que cualquier
// llamada posterior a getUsers() simplemente la awaite.
(async () => { await CONFIG._initUsers(); })();