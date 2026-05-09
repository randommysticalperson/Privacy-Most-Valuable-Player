/**
 * App.tsx — Root Application
 * Design: Zero-Knowledge Glass — Dark Space Glassmorphism
 * Theme: Dark (near-black background)
 *
 * Auth: MetaMask Embedded Wallets SDK via @web3auth/modal/react
 *   - Web3AuthProvider wraps the entire app
 *   - useWeb3AuthConnect / useWeb3AuthDisconnect / useWeb3AuthUser hooks
 *     are available anywhere inside the provider
 */

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SemaphoreProvider } from "./contexts/SemaphoreContext";
import { Web3AuthProvider } from "@web3auth/modal/react";
import { web3AuthContextConfig } from "./lib/web3authConfig";
import Home from "./pages/Home";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        {/* MetaMask Embedded Wallets SDK Provider */}
        <Web3AuthProvider config={web3AuthContextConfig}>
          <SemaphoreProvider>
            <TooltipProvider>
              <Toaster
                theme="dark"
                toastOptions={{
                  style: {
                    background: 'oklch(0.14 0.015 265 / 0.9)',
                    border: '1px solid oklch(1 0 0 / 0.1)',
                    backdropFilter: 'blur(16px)',
                    color: 'oklch(0.93 0.005 265)',
                    fontFamily: "'DM Sans', sans-serif",
                  },
                }}
              />
              <Router />
            </TooltipProvider>
          </SemaphoreProvider>
        </Web3AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
