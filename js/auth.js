/* ============================================================
   Auth — CU-3: Autenticar usuarios y gestionar roles/permisos
   - Login / logout con sesión en sessionStorage
   - Verificación de permisos por rol
   - Bitácora de auditoría (RQNF-10)
   ============================================================ */

const Auth = (() => {

  let _currentUser = null;

  // Cache en memoria de los logs descifrados — evita descifrar en cada
  // lectura y permite que addLog() siga siendo sincrona para no romper
  // los ~15 call sites existentes en dashboard.html.
  let _logsCache = null;
  let _logsReady = _loadLogs();

  async function _loadLogs () {
    const raw = localStorage.getItem(CONFIG.keys.logs);
    _logsCache = (await Crypto.decrypt(raw)) || [];
    return _logsCache;
  }

  async function _persistLogs () {
    localStorage.setItem(CONFIG.keys.logs, await Crypto.encrypt(_logsCache));
  }

  /* ── Inicializar: restaurar sesión guardada (async — datos cifrados) ── */
  async function init () {
    const raw = sessionStorage.getItem(CONFIG.keys.session);
    const saved = await Crypto.decrypt(raw);
    if (saved) {
      const user = await CONFIG.getUserById(saved.id);
      if (user) {
        _currentUser = user;
        return true;
      }
    }
    return false;
  }

  /* ── Login async — hash SHA-256 (CU-3: flujo normal) ──────── */
  async function login (username, password) {
    const user = await CONFIG.findUser(username, password);

    if (!user) {
      // CU-3 flujo alternativo 3A: credenciales incorrectas
      addLog('WARN', `Intento de acceso fallido: usuario "${username}"`);
      return { ok: false, msg: 'Credenciales incorrectas.' };
    }

    _currentUser = user;

    // Poscondición CU-3: sesión establecida (cifrada — RQF-07)
    sessionStorage.setItem(
      CONFIG.keys.session,
      await Crypto.encrypt({ id: user.id, ts: Date.now() })
    );

    // Poscondición CU-3: evento registrado en bitácora
    addLog('INFO', `Inicio de sesión: ${user.name} (${user.role})`);
    return { ok: true, user };
  }

  /* ── Logout ─────────────────────────────────────────────────── */
  function logout () {
    if (_currentUser) {
      addLog('INFO', `Cierre de sesión: ${_currentUser.name}`);
    }
    _currentUser = null;
    sessionStorage.removeItem(CONFIG.keys.session);
  }

  /* ── Usuario activo ──────────────────────────────────────────── */
  function currentUser () {
    return _currentUser;
  }

  /* ── Verificar permiso por rol (CU-3) ───────────────────────── */
  function can (perm) {
    return _currentUser?.perms?.includes(perm) ?? false;
  }

  /* ── Require: redirigir si no hay sesión válida (async) ─────── */
  async function require () {
    if (!(await init())) {
      window.location.href = 'index.html';
      return null;
    }
    return _currentUser;
  }

  /* ── Bitácora de auditoría (RQNF-10) — cifrada en reposo (RQF-07) ──
     Sincrona de cara al llamador: escribe en la cache en memoria de
     inmediato y persiste cifrado en segundo plano. */
  function addLog (level, msg) {
    const entry = {
      ts:    new Date().toISOString(),
      level,
      msg,
      user:  _currentUser?.username || 'sistema',
    };

    const write = async () => {
      await _logsReady;
      _logsCache.unshift(entry);
      if (_logsCache.length > 500) _logsCache.length = 500;
      await _persistLogs();
    };
    _logsReady = write();
  }

  /* ── Leer logs (async — datos cifrados) ─────────────────────── */
  async function getLogs () {
    await _logsReady;
    return _logsCache || [];
  }

  return { init, login, logout, currentUser, can, require, addLog, getLogs };

})();
