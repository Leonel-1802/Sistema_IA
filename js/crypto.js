/* ============================================================
   Crypto — Encriptacion de datos en reposo (RQF-07, RQNF-05)
   - AES-256-GCM sobre Web Crypto API (nativo del navegador)
   - Aplica a todo lo persistido en localStorage/sessionStorage
   - Excepcion confirmada: la API key del modelo (js/config.js)
     NO se cifra.
   ============================================================ */

const Crypto = (() => {

  // Sal fija de aplicacion para derivar la clave simetrica.
  // Nota tecnica: en un despliegue con backend, esta clave debe
  // vivir fuera del cliente (servidor / HSM / KMS). Aqui el
  // sistema es 100% frontend, por lo que la clave se deriva
  // localmente con PBKDF2 a partir de un material fijo de la app.
  const _SALT_HEX  = '53697374656d61494137444e463135';
  const _KEY_MATERIAL = 'SISTEMA_DE_IA::AES-256-GCM::v1';

  let _cryptoKey = null;

  function _hexToBytes (hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  async function _getKey () {
    if (_cryptoKey) return _cryptoKey;

    const baseKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(_KEY_MATERIAL),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    _cryptoKey = await crypto.subtle.deriveKey(
      {
        name:       'PBKDF2',
        salt:       _hexToBytes(_SALT_HEX),
        iterations: 100000,
        hash:       'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    return _cryptoKey;
  }

  function _bytesToBase64 (bytes) {
    let bin = '';
    bytes.forEach(b => bin += String.fromCharCode(b));
    return btoa(bin);
  }

  function _base64ToBytes (b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  /* ── Cifrar cualquier valor serializable a JSON ─────────────
     Devuelve un string "iv:ciphertext" en base64, listo para
     guardar en localStorage/sessionStorage. */
  async function encrypt (value) {
    const key = await _getKey();
    const iv  = crypto.getRandomValues(new Uint8Array(12));
    const data = new TextEncoder().encode(JSON.stringify(value));

    const cipherBuf = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return `${_bytesToBase64(iv)}:${_bytesToBase64(new Uint8Array(cipherBuf))}`;
  }

  /* ── Descifrar un string generado por encrypt() ─────────────
     Devuelve el valor original (ya parseado desde JSON), o
     null si el dato no existe, esta corrupto o no se pudo
     descifrar. */
  async function decrypt (packed) {
    if (!packed) return null;
    try {
      const [ivB64, dataB64] = packed.split(':');
      const iv   = _base64ToBytes(ivB64);
      const data = _base64ToBytes(dataB64);
      const key  = await _getKey();

      const plainBuf = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );

      return JSON.parse(new TextDecoder().decode(plainBuf));
    } catch (_) {
      return null; // dato corrupto / clave incorrecta / formato legado
    }
  }

  return { encrypt, decrypt };

})();