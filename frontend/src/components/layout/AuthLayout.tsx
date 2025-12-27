/**
 * Auth Layout
 * Centered layout for login/register pages
 */

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">ApprovalFlow</h1>
          <p className="text-gray-600">Système de gestion des flux d'approbation</p>
        </div>
        {children}
      </div>
    </div>
  );
}
