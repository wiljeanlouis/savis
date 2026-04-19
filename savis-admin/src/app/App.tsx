import { QueryProvider } from "./providers/QueryProvider"
import { AppRouter } from "./router/AppRouter"

function App() {
  return (
    <QueryProvider>
      <AppRouter />
    </QueryProvider>
  )
}

export default App