import { QueryProvider } from "./providers/QueryProvider"
import { ThemeProvider } from "./providers/ThemeProvider"
import { AppRouter } from "./router/AppRouter"

function App() {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AppRouter />
      </QueryProvider>
    </ThemeProvider>
  )
}

export default App