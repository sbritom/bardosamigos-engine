import Router from "./apps/portal/routes/Router";
import AppErrorBoundary from "./shared/errors/AppErrorBoundary";

export default function App() {
  return (
    <AppErrorBoundary>
      <Router />
    </AppErrorBoundary>
  );
}
