import AdminSetup from '../setup'

export default function AdminSetupPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Admin Setup</h1>
        <AdminSetup />
      </div>
    </div>
  )
} 