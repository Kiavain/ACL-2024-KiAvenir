/**
 * Hash un texte avec l'algorithme SHA-256
 * @param input {string} Le texte à hasher
 * @returns {Promise<string>} Le hash
 */
async function hashSHA256(input) {
  const textBuffer = new TextEncoder().encode(input);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", textBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((item) => item.toString(16).padStart(2, "0")).join("");
}
