export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0d0705] flex items-center justify-center">
      <div className="text-center">
        {/* Animated basketball */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div
            className="absolute inset-0 rounded-full animate-bounce"
            style={{
              background: 'linear-gradient(135deg, #ff6b00 0%, #cc5500 50%, #ff8533 100%)',
              boxShadow: '0 0 40px rgba(255, 107, 0, 0.6), inset -10px -10px 20px rgba(0,0,0,0.3)',
            }}
          >
            {/* Basketball lines */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-1 bg-black/40 rounded-full" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1 h-full bg-black/40 rounded-full" />
            </div>
            <div
              className="absolute inset-2 rounded-full border-2 border-black/30"
              style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }}
            />
          </div>
          {/* Shadow */}
          <div
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-4 rounded-full animate-pulse"
            style={{
              background: 'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)',
            }}
          />
        </div>
        <h1
          className="text-4xl font-bold tracking-wider"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          <span className="text-[#ff6b00]">KET</span>
          <span className="text-[#00d4ff]">BALL</span>
        </h1>
        <p className="text-white/50 mt-2 text-sm tracking-widest uppercase">Loading...</p>
      </div>
    </div>
  );
}
