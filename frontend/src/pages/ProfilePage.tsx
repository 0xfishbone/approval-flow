/**
 * Profile Page
 * User profile and settings with signature management
 */

import { useState, useEffect } from 'react';
import { CheckCircle2, PenTool, Fingerprint, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import SignaturePad from '@/components/signature/SignaturePad';
import {
  isBiometricAvailable,
  getBiometricType,
  getBiometricPreference,
  setBiometricPreference,
  registerBiometric,
  arrayBufferToBase64,
  storeCredentialId,
  clearBiometricData,
} from '@/lib/biometric';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Biometric state
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [isEnablingBiometric, setIsEnablingBiometric] = useState(false);

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    const available = await isBiometricAvailable();
    setBiometricAvailable(available);

    if (available) {
      const type = await getBiometricType();
      setBiometricType(type);
      setBiometricEnabled(getBiometricPreference());
    }
  };

  if (!user) return null;

  const handleSaveSignature = async (signatureData: string) => {
    try {
      await api.post('/signatures/visual', {
        signatureData,
        description: 'Profile signature',
      });

      setSignature(signatureData);
      setShowSignaturePad(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save signature:', error);
      alert('Erreur lors de l\'enregistrement de la signature');
    }
  };

  const handleEnableBiometric = async () => {
    setIsEnablingBiometric(true);
    try {
      // Get challenge from server
      const { challenge } = await api.post<{ challenge: string }>('/auth/biometric/challenge', {
        email: user.email,
      });

      // Convert challenge to Uint8Array
      const challengeArray = Uint8Array.from(atob(challenge), (c) => c.charCodeAt(0));

      // Register biometric credential
      const credential = await registerBiometric({
        challenge: challengeArray,
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        userId: Uint8Array.from(user.id, (c) => c.charCodeAt(0)),
      });

      if (!credential) {
        throw new Error('Failed to register biometric credential');
      }

      // Send credential to server
      await api.post('/auth/biometric/register', {
        credentialId: credential.id,
        publicKey: arrayBufferToBase64(credential.rawId),
        attestation: arrayBufferToBase64((credential.response as AuthenticatorAttestationResponse).attestationObject),
      });

      // Store credential ID and enable preference
      storeCredentialId(credential.id);
      setBiometricPreference(true);
      setBiometricEnabled(true);

      alert(`${biometricType} activé avec succès!`);
    } catch (error) {
      console.error('Failed to enable biometric:', error);
      alert('Erreur lors de l\'activation de l\'authentification biométrique');
    } finally {
      setIsEnablingBiometric(false);
    }
  };

  const handleDisableBiometric = () => {
    clearBiometricData();
    setBiometricEnabled(false);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Profil</h1>

      <div className="space-y-6">
        {/* Personal Information */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Informations personnelles</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Nom complet</label>
              <p className="font-medium">
                {user.firstName} {user.lastName}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Rôle</label>
              <p className="font-medium">{user.role}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Statut</label>
              <p className="font-medium">
                {user.isActive ? (
                  <span className="inline-flex items-center gap-1.5 text-green-600">
                    <CheckCircle2 size={16} aria-hidden="true" />
                    Actif
                  </span>
                ) : (
                  <span className="text-gray-600">Inactif</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Signature Management */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Signature électronique</h2>

          {saveSuccess && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
              <CheckCircle2 size={20} aria-hidden="true" />
              <span className="text-sm font-medium">Signature enregistrée avec succès</span>
            </div>
          )}

          {signature ? (
            <div className="space-y-4">
              <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                <img
                  src={signature}
                  alt="Votre signature"
                  className="max-h-32 mx-auto"
                />
              </div>
              <button
                onClick={() => setShowSignaturePad(true)}
                className="btn btn-secondary w-full"
              >
                <PenTool size={20} aria-hidden="true" />
                Modifier la signature
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Ajoutez votre signature électronique pour approuver les demandes
              </p>
              <button
                onClick={() => setShowSignaturePad(true)}
                className="btn btn-primary w-full"
              >
                <PenTool size={20} aria-hidden="true" />
                Ajouter une signature
              </button>
            </div>
          )}
        </div>

        {/* Biometric Authentication */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Authentification biométrique</h2>

          {!biometricAvailable ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Non disponible</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Votre appareil ne supporte pas l'authentification biométrique
                </p>
              </div>
            </div>
          ) : biometricEnabled ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-green-800">{biometricType} activé</p>
                  <p className="text-xs text-green-700 mt-1">
                    Vous pouvez maintenant vous connecter avec {biometricType}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDisableBiometric}
                className="btn btn-secondary w-full"
              >
                Désactiver {biometricType}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Utilisez {biometricType} pour une connexion rapide et sécurisée
              </p>
              <button
                onClick={handleEnableBiometric}
                disabled={isEnablingBiometric}
                className="btn btn-primary w-full"
              >
                <Fingerprint size={20} aria-hidden="true" />
                {isEnablingBiometric ? 'Configuration...' : `Activer ${biometricType}`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <SignaturePad
          onSave={handleSaveSignature}
          onCancel={() => setShowSignaturePad(false)}
          existingSignature={signature || undefined}
        />
      )}
    </div>
  );
}
