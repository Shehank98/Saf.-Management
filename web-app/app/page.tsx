import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center px-4">
      <div className="text-center text-white max-w-lg">
        <div className="text-7xl mb-6">🌿</div>
        <h1 className="text-5xl font-bold mb-3">Safari Adventures</h1>
        <p className="text-xl text-green-200 mb-12">Sri Lanka&apos;s premier safari management platform</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="bg-white text-green-900 font-bold px-10 py-4 rounded-2xl text-lg hover:bg-green-50 transition-colors shadow-lg"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="bg-green-500 hover:bg-green-400 text-white font-bold px-10 py-4 rounded-2xl text-lg transition-colors shadow-lg"
          >
            Register
          </Link>
        </div>

        <p className="mt-10 text-green-400 text-sm">
          Platform for Safari Owners &amp; Vendors
        </p>
      </div>
    </main>
  );
}
