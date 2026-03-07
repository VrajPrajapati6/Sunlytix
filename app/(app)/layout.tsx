import DashboardHeader from "@/components/DashboardHeader";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-black text-white relative print:h-auto print:overflow-visible print:bg-white print:text-black">
      {/* Futuristic Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 print:hidden">
        {/* Animated Grid */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
        
        {/* Radial Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,106,0,0.05),_transparent_70%)]" />
        
        {/* Moving Particles (CSS only fallback for speed) */}
        {[...Array(6)].map((_, i) => (
          <div 
            key={i}
            className="absolute w-1 h-1 bg-orange-500/30 rounded-full animate-particle-slow"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 3}s`,
              animationDuration: `${15 + i * 5}s`
            }}
          />
        ))}
      </div>

      <div className="print:hidden relative z-10">
        <DashboardHeader />
      </div>
      <main className="flex-1 overflow-y-auto relative z-10 print:overflow-visible print:bg-none print:bg-white">
        {children}
      </main>
    </div>
  );
}
