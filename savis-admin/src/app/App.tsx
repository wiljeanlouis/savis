import { ThemeProvider } from "next-themes";
import { QueryProvider } from "./providers/QueryProvider";
import { AppRouter } from "./router/AppRouter";

function App() {
  return (
    <ThemeProvider attribute="class">
      <QueryProvider>
        <AppRouter />
      </QueryProvider>
    </ThemeProvider>
  );
}

export default App;
