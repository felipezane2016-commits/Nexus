import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
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

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <PortalProvider>
            <Router />
          </PortalProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
