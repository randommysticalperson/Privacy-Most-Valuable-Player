/**
 * App.tsx — Root Application
 * Design: Zero-Knowledge Glass — Dark Space Glassmorphism
 * Theme: Dark (near-black #080C14 background)
 */

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { WalletProvider } from "./contexts/WalletContext";
import { SemaphoreProvider } from "./contexts/SemaphoreContext";
import Home from "./pages/Home";
function Router() {
  // make sure to consider if you need authentication for certain routes
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
        <WalletProvider>
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
        </WalletProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
