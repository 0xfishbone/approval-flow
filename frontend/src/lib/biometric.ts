/**
 * Biometric Authentication Utility
 * WebAuthn API integration for Face ID / Touch ID / Fingerprint
 */

interface BiometricCredential {
  id: string;
  type: 'public-key';
  rawId: ArrayBuffer;
  response: AuthenticatorAttestationResponse | AuthenticatorAssertionResponse;
}

interface BiometricOptions {
  challenge: Uint8Array;
  userEmail: string;
  userName: string;
  userId: Uint8Array;
}

/**
 * Check if biometric authentication is available
 */
export async function isBiometricAvailable(): Promise<boolean> {
  if (!window.PublicKeyCredential) {
    return false;
  }

  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch (error) {
    console.error('Error checking biometric availability:', error);
    return false;
  }
}

/**
 * Register a new biometric credential
 */
export async function registerBiometric(options: BiometricOptions): Promise<BiometricCredential | null> {
  try {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: new Uint8Array(options.challenge),
        rp: {
          name: 'Approval Flow',
          id: window.location.hostname,
        },
        user: {
          id: new Uint8Array(options.userId),
          name: options.userEmail,
          displayName: options.userName,
        },
        pubKeyCredParams: [
          {
            type: 'public-key',
            alg: -7, // ES256
          },
          {
            type: 'public-key',
            alg: -257, // RS256
          },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
        attestation: 'direct',
      },
    }) as PublicKeyCredential | null;

    if (!credential) {
      return null;
    }

    return {
      id: credential.id,
      type: credential.type as 'public-key',
      rawId: credential.rawId,
      response: credential.response as AuthenticatorAttestationResponse,
    };
  } catch (error) {
    console.error('Error registering biometric:', error);
    throw error;
  }
}

/**
 * Authenticate using biometric credential
 */
export async function authenticateBiometric(challenge: Uint8Array, credentialId?: string): Promise<BiometricCredential | null> {
  try {
    const allowCredentials = credentialId
      ? [
          {
            type: 'public-key' as const,
            id: base64ToArrayBuffer(credentialId),
          },
        ]
      : [];

    const credential = await navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array(challenge),
        rpId: window.location.hostname,
        allowCredentials,
        userVerification: 'required',
        timeout: 60000,
      },
    }) as PublicKeyCredential | null;

    if (!credential) {
      return null;
    }

    return {
      id: credential.id,
      type: credential.type as 'public-key',
      rawId: credential.rawId,
      response: credential.response as AuthenticatorAssertionResponse,
    };
  } catch (error) {
    console.error('Error authenticating with biometric:', error);
    throw error;
  }
}

/**
 * Convert ArrayBuffer to base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Convert base64 string to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Get biometric type name (Face ID, Touch ID, Fingerprint, etc.)
 */
export async function getBiometricType(): Promise<string> {
  const available = await isBiometricAvailable();
  if (!available) {
    return 'Non disponible';
  }

  // Detect platform
  const userAgent = navigator.userAgent.toLowerCase();
  const isMac = /macintosh|mac os x/.test(userAgent);
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);

  if (isIOS || isMac) {
    // Check for specific biometric type on Apple devices
    const hasTouchID = isMac; // Mac devices typically have Touch ID
    const hasFaceID = isIOS && !/(iphone\s?(6|7|8|se))/.test(userAgent); // Newer iPhones have Face ID

    if (hasFaceID) return 'Face ID';
    if (hasTouchID) return 'Touch ID';
    return 'Biométrie Apple';
  }

  if (isAndroid) {
    return 'Empreinte digitale';
  }

  return 'Authentification biométrique';
}

/**
 * Store biometric preference in localStorage
 */
export function setBiometricPreference(enabled: boolean): void {
  localStorage.setItem('biometric_enabled', enabled ? 'true' : 'false');
}

/**
 * Get biometric preference from localStorage
 */
export function getBiometricPreference(): boolean {
  return localStorage.getItem('biometric_enabled') === 'true';
}

/**
 * Store credential ID in localStorage
 */
export function storeCredentialId(credentialId: string): void {
  localStorage.setItem('biometric_credential_id', credentialId);
}

/**
 * Get credential ID from localStorage
 */
export function getCredentialId(): string | null {
  return localStorage.getItem('biometric_credential_id');
}

/**
 * Clear biometric data from localStorage
 */
export function clearBiometricData(): void {
  localStorage.removeItem('biometric_enabled');
  localStorage.removeItem('biometric_credential_id');
}
