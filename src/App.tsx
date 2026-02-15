import { useConvexAuth } from "convex/react";
import { AuthScreen } from "./components/AuthScreen";
import { GameLobby } from "./components/GameLobby";
import { LoadingScreen } from "./components/LoadingScreen";

export default function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-[#0d0705] text-white overflow-x-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Court texture overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 50px,
              rgba(139, 69, 19, 0.3) 50px,
              rgba(139, 69, 19, 0.3) 51px
            )`,
          }}
        />
        {/* Radial glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[150vw] h-[60vh] opacity-30"
          style={{
            background: 'radial-gradient(ellipse at center top, rgba(255, 107, 0, 0.4) 0%, transparent 70%)',
          }}
        />
        {/* Bottom glow */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[40vh] opacity-20"
          style={{
            background: 'radial-gradient(ellipse at center bottom, rgba(0, 212, 255, 0.3) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10">
        {isAuthenticated ? <GameLobby /> : <AuthScreen />}
      </div>
    </div>
  );
}
