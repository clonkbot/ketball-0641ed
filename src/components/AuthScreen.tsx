import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";

export function AuthScreen() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    try {
      await signIn("password", formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymous = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to continue as guest");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <div className="text-center mb-8 md:mb-12">
        {/* Basketball icon */}
        <div className="relative w-20 h-20 md:w-28 md:h-28 mx-auto mb-4 md:mb-6">
          <div
            className="absolute inset-0 rounded-full animate-pulse"
            style={{
              background: 'linear-gradient(135deg, #ff6b00 0%, #cc5500 50%, #ff8533 100%)',
              boxShadow: '0 0 60px rgba(255, 107, 0, 0.5)',
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-0.5 md:h-1 bg-black/40 rounded-full" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-0.5 md:w-1 h-full bg-black/40 rounded-full" />
            </div>
          </div>
        </div>
        <h1
          className="text-5xl md:text-7xl font-bold tracking-wider"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          <span
            className="inline-block"
            style={{
              background: 'linear-gradient(180deg, #ff6b00 0%, #ff9500 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 40px rgba(255, 107, 0, 0.5)',
            }}
          >
            KET
          </span>
          <span
            className="inline-block"
            style={{
              background: 'linear-gradient(180deg, #00d4ff 0%, #00a3cc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 40px rgba(0, 212, 255, 0.5)',
            }}
          >
            BALL
          </span>
        </h1>
        <p
          className="text-white/60 text-sm md:text-base tracking-[0.3em] uppercase mt-2"
          style={{ fontFamily: "'Russo One', sans-serif" }}
        >
          Head-to-Head Basketball
        </p>
      </div>

      {/* Auth form */}
      <div
        className="w-full max-w-sm md:max-w-md p-6 md:p-8 rounded-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(26, 15, 10, 0.9) 0%, rgba(13, 7, 5, 0.95) 100%)',
          border: '1px solid rgba(255, 107, 0, 0.2)',
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 107, 0, 0.1)',
        }}
      >
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-[#ff6b00]/50 rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-[#00d4ff]/50 rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-[#00d4ff]/50 rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-[#ff6b00]/50 rounded-br-2xl" />

        <h2
          className="text-2xl md:text-3xl font-bold text-center mb-6"
          style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
        >
          {flow === "signIn" ? "SIGN IN" : "CREATE ACCOUNT"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              className="w-full px-4 py-3 md:py-4 rounded-lg bg-black/50 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#ff6b00]/50 focus:ring-1 focus:ring-[#ff6b00]/30 transition-all text-base"
              style={{ fontFamily: "'Russo One', sans-serif" }}
            />
          </div>
          <div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              minLength={6}
              className="w-full px-4 py-3 md:py-4 rounded-lg bg-black/50 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#ff6b00]/50 focus:ring-1 focus:ring-[#ff6b00]/30 transition-all text-base"
              style={{ fontFamily: "'Russo One', sans-serif" }}
            />
          </div>
          <input type="hidden" name="flow" value={flow} />

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 md:py-4 rounded-lg font-bold text-lg tracking-wider transition-all duration-300 disabled:opacity-50 min-h-[48px]"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              background: 'linear-gradient(135deg, #ff6b00 0%, #cc5500 100%)',
              boxShadow: '0 4px 20px rgba(255, 107, 0, 0.4)',
            }}
          >
            {isLoading ? "..." : flow === "signIn" ? "LET'S PLAY" : "JOIN THE GAME"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
            className="text-white/60 hover:text-[#00d4ff] transition-colors text-sm py-2"
            style={{ fontFamily: "'Russo One', sans-serif" }}
          >
            {flow === "signIn" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center">
            <span
              className="px-4 text-white/40 text-sm uppercase tracking-wider"
              style={{
                fontFamily: "'Russo One', sans-serif",
                background: 'linear-gradient(135deg, rgba(26, 15, 10, 1) 0%, rgba(13, 7, 5, 1) 100%)',
              }}
            >
              or
            </span>
          </div>
        </div>

        <button
          onClick={handleAnonymous}
          disabled={isLoading}
          className="w-full py-3 md:py-4 rounded-lg font-bold text-lg tracking-wider transition-all duration-300 border border-[#00d4ff]/30 hover:border-[#00d4ff]/60 hover:bg-[#00d4ff]/10 disabled:opacity-50 min-h-[48px]"
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            color: '#00d4ff',
          }}
        >
          PLAY AS GUEST
        </button>
      </div>

      {/* Footer */}
      <footer className="mt-8 md:mt-12 text-center text-white/30 text-xs">
        <p>Requested by @y994638341685 · Built by @clonkbot</p>
      </footer>
    </div>
  );
}
