// --- Encryption Utilities ---
const arrayBufferToBase64 = (buffer) => {
    let binary = ''; const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
};

const base64ToArrayBuffer = (base64) => {
    const binary_string = atob(base64); const bytes = new Uint8Array(binary_string.length);
    for (let i = 0; i < binary_string.length; i++) bytes[i] = binary_string.charCodeAt(i);
    return bytes;
};

const deriveKey = async (password) => {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode("wealth-planner-salt-v5"), iterations: 100000, hash: "SHA-256" },
    keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
  );
};

export const encryptData = async (dataObj, password) => {
  if (!password) return JSON.stringify(dataObj);
  const key = await deriveKey(password);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, enc.encode(JSON.stringify(dataObj)));
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0); combined.set(new Uint8Array(encrypted), iv.length);
  return "ENCRYPTED:" + arrayBufferToBase64(combined);
};

export const decryptData = async (text, password) => {
  if (!text.startsWith("ENCRYPTED:")) return JSON.parse(text);
  if (!password) throw new Error("Decryption password required.");
  const key = await deriveKey(password);
  const combined = base64ToArrayBuffer(text.replace("ENCRYPTED:", ""));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, data);
  const dec = new TextDecoder();
  return JSON.parse(dec.decode(decrypted));
};