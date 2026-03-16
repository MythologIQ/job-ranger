import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { ThemeProvider } from "./theme/ThemeProvider";
import { Dashboard } from "./pages/Dashboard";
import { Companies } from "./pages/Companies";
import { Jobs } from "./pages/Jobs";
import { Filters } from "./pages/Filters";
import { Settings } from "./pages/Settings";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastContainer } from "./components/ToastContainer";
import { useAppContext } from "./context/AppContext";

function AppRoutes() {
  const { toasts, removeToast } = useAppContext();

  return (
    <>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/filters" element={<Filters />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <Router>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
        </Router>
      </AppProvider>
    </ThemeProvider>
  );
}
