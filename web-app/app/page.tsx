import Link from 'next/link';
import { Compass, Users, TrendingUp, MapPin, Bell, Wifi } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1A3D2B] via-[#2D6A4F] to-[#3D7A5F] flex flex-col items-center justify-center px-5 py-16 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute -bottom-40 -right-20 w-80 h-80 rounded-full bg-[#8B5E3C]/20 blur-3xl" />

      <div className="w-full max-w-sm mx-auto text-center relative z-10">
        {/* Logo */}
        <div className="w-20 h-20 bg-white/15 backdrop-blur-sm rounded-[22px] flex items-center justify-center mx-auto mb-7 shadow-lg border border-white/20">
          <Compass className="w-10 h-10 text-white" strokeWidth={1.8} />
        </div>

        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2" style={{letterSpacing: '-0.02em'}}>
          Safari Adventures
        </h1>
        <p className="text-[#A8D5BC] text-base mb-10 font-medium">
          Manage every safari, every step.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col gap-3 mb-12">
          <Link
            href="/book"
            className="w-full bg-white text-[#2D6A4F] font-bold text-base py-4 rounded-[16px] flex items-center justify-center gap-2.5 shadow-lg hover:bg-[#F4F9F6] transition-colors"
          >
            <MapPin className="w-5 h-5" />
            Browse Safaris
          </Link>
          <Link
            href="/login"
            className="w-full bg-white/10 backdrop-blur-sm text-white font-semibold text-base py-4 rounded-[16px] flex items-center justify-center gap-2 border border-white/20 hover:bg-white/15 transition-colors"
          >
            Owner / Vendor Login
          </Link>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-12">
          {[
            { icon: Users, title: 'Shared & Private Safaris', desc: '4-seat minimum · free reservation until filled' },
            { icon: TrendingUp, title: 'Live Revenue Analytics', desc: 'Track earnings, vendors & commissions' },
            { icon: Bell, title: 'WhatsApp Notifications', desc: 'Real-time updates on every booking event' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-4 bg-white/[0.08] backdrop-blur-sm rounded-[14px] p-4 text-left border border-white/10">
              <div className="w-10 h-10 bg-white/15 rounded-[10px] flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-[#A8D5BC]" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-white font-semibold text-[13.5px] leading-tight">{title}</p>
                <p className="text-[#A8D5BC] text-[12px] mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* PWA hint */}
        <div className="flex items-center gap-2 justify-center text-[#A8D5BC] text-xs">
          <Wifi className="w-3.5 h-3.5" />
          <span>Works offline · Add to home screen for app experience</span>
        </div>
      </div>
    </main>
  );
}
