import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Router as WouterRouter, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import ErrorBoundary from "./components/ErrorBoundary";
import { PortalProvider, usePortal } from "./contexts/PortalContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Closing from "./pages/Closing";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Receipts from "./pages/Receipts";

/**
 * Rotas do protótipo. A sessão é local (ver PortalContext) — quem não está
 * autenticado é levado para /login.
 */
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { signedIn } = usePortal();
  if (!signedIn) return <Redirect to="/login" />;
  return <>{children}</>;
}

function Router() {
  const { signedIn } = usePortal();

  return (
    <Switch>
      <Route path="/login">{signedIn ? <Redirect to="/" /> : <Login />}</Route>
      <Route path="/">
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      </Route>
      <Route path="/recibos">
        <PrivateRoute>
          <Receipts />
        </PrivateRoute>
      </Route>
      <Route path="/fechamento">
        <PrivateRoute>
          <Closing />
        </PrivateRoute>
      </Route>
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// O protótipo usa o design system em client/src/index.css, que é claro por
// definição — por isso o tema não é alternável aqui.

// Builds estáticos publicados fora de um servidor com fallback de SPA (preview
// por link, GitHub Pages) não conseguem servir /recibos direto. Com
// VITE_HASH_ROUTER=1 as rotas passam a viver no hash (#/recibos) e funcionam em
// qualquer caminho. O dev e o build normal seguem com rotas em path.
const hashRouting = import.meta.env.VITE_HASH_ROUTER === "1";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <PortalProvider>
            {hashRouting ? (
              <WouterRouter hook={useHashLocation}>
                <Router />
              </WouterRouter>
            ) : (
              <Router />
            )}
          </PortalProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
