import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-white">
          <h1 className="text-5xl font-bold mb-4">Safari Adventures</h1>
          <p className="text-xl text-green-200 mb-12">Experience the wild with us</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-8 hover:bg-white/20 transition-all">
              <div className="text-5xl mb-4">🚙</div>
              <h2 className="text-2xl font-bold mb-2">Shared Safari</h2>
              <p className="text-green-200 mb-6">Join a group and explore together from LKR 3,500/seat</p>
              <Link
                href="/book"
                className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                Book Now
              </Link>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-8 hover:bg-white/20 transition-all">
              <div className="text-5xl mb-4">👑</div>
              <h2 className="text-2xl font-bold mb-2">Private Safari</h2>
              <p className="text-green-200 mb-6">Exclusive private tour tailored just for you</p>
              <Link
                href="/book/private"
                className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                Inquire
              </Link>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-8 hover:bg-white/20 transition-all">
              <div className="text-5xl mb-4">📱</div>
              <h2 className="text-2xl font-bold mb-2">Vendor Portal</h2>
              <p className="text-green-200 mb-6">Jeep providers, guides and restaurants join us</p>
              <Link
                href="/auth/login"
                className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                Login
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 text-sm text-green-300">
            <Link href="/admin" className="hover:text-white transition-colors">Admin Dashboard</Link>
            <span className="hidden sm:inline">•</span>
            <Link href="/owner" className="hover:text-white transition-colors">Owner Portal</Link>
            <span className="hidden sm:inline">•</span>
            <Link href="/auth/register" className="hover:text-white transition-colors">Create Account</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
