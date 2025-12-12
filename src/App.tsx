import { ThemeProvider } from "next-themes";
import { ThemeToggle } from "./components/ThemeToggle";
import { Timer } from "./components/timer/Timer";

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-6">
            <h1 className="text-xl font-semibold">⏱️ TimeKeeper</h1>
            <ThemeToggle />
          </div>
        </header>

        {/* Main Content */}
        <main className="animate-fadeIn">
          <Timer />
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
