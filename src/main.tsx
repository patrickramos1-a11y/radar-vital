import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AppErrorBoundary } from "./components/layout/AppErrorBoundary.tsx";
import "./index.css";
import "./styles/ramos/vidro.css";
import "./styles/ramos/efeitos.css";
import "./styles/ramos/tipografia.css";
import "./styles/ramos-noite.css";
import "./styles/ramos-agua.css";

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>,
);
