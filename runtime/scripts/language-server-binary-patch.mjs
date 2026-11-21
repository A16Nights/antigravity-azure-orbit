// Default dynamic-port plan for Antigravity 2.32+/2.33+/2.34+ (no binary modification required).
export function planLanguageServerBinary(_binaryBytes, requested = false) {
  if (requested) {
    throw new Error('BINARY_PATCH_UNSUPPORTED: Explicit language-server binary patching is not bundled in this plugin.');
  }
  return { mode: 'dynamic', bytes: null };
}
