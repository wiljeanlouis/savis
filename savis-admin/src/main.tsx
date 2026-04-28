import { createRoot } from "react-dom/client";
import "./global.css";
import App from "./app/App.tsx";

createRoot(document.getElementById("root")!).render(<App />);
