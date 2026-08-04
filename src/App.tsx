import { useState, useEffect } from "react";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { CATEGORY_TOOLS_NAME, CATEGORY_GAMES_NAME } from "./data";
import { loadTools, loadGames, type ToolInfo, type GameInfo } from "./backblaze";
import ToolCard from "./components/ToolCard";
import GameCard from "./components/GameCard";
import ToolModal from "./components/ToolModal";
import GameModal from "./components/GameModal";
import RedeemSection from "./components/RedeemSection";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  const [tools, setTools] = useState<ToolInfo[]>([]);
  const [games, setGames] = useState<GameInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedTool, setSelectedTool] = useState<ToolInfo | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameInfo | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [toolsData, gamesData] = await Promise.all([
        loadTools(),
        loadGames(),
      ]);
      setTools(toolsData);
      setGames(gamesData);
    } catch (err) {
      console.error("Fehler beim Laden:", err);
      const message = err instanceof Error ? err.message : "";
      if (message.includes("VITE_API_BASE_URL")) {
        setError("Backend nicht konfiguriert. Setze VITE_API_BASE_URL auf deinen API-Proxy.");
      } else {
        setError("Fehler beim Laden der Daten. Bitte später erneut versuchen.");
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalItems = tools.length + games.length;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      {/* Header */}
      <header className="px-5 sm:px-10 lg:px-16 pt-8 sm:pt-10 pb-2">
        <nav className="flex items-center justify-between mb-10 sm:mb-14">
          <span className="font-mono text-sm font-semibold text-neutral-700 tracking-tight">
            depot/
          </span>
          <span className="text-[11px] font-mono text-neutral-400">
            {loading ? "..." : `${totalItems} verfügbar`}
          </span>
        </nav>

        {/* Headline */}
        <div className="max-w-2xl mb-8 sm:mb-10">
          <h1
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 leading-tight mb-3"
            style={{ letterSpacing: "-0.03em" }}
          >
            Werkzeuge,<br />
            die machen was sie sollen.
          </h1>
          <p className="text-sm text-neutral-500 leading-relaxed max-w-sm">
            Kein Marketing. Kein Abo-Modell. Kein Cloud-Zwang.
            <br />
            Code kaufen, einlösen, runterladen. Fertig.
          </p>
        </div>

        {/* Redeem — direkt oben */}
        <div className="bg-white border border-neutral-200 rounded-lg p-5 sm:p-6 max-w-xl">
          <RedeemSection />
        </div>
      </header>

      {/* Trennlinie */}
      <div className="px-5 sm:px-10 lg:px-16 my-8 sm:my-12">
        <div className="border-b border-neutral-200/80 max-w-[120px]" />
      </div>

      {/* Main Content */}
      <main className="px-5 sm:px-10 lg:px-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
            <Loader2 size={32} className="animate-spin mb-4" />
            <span className="text-sm font-mono">Lade Daten von Backblaze...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertTriangle size={32} className="text-red-400 mb-4" />
            <p className="text-sm text-neutral-600 mb-4">{error}</p>
            <button
              onClick={loadData}
              className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 cursor-pointer"
            >
              <RefreshCw size={14} />
              Erneut versuchen
            </button>
          </div>
        ) : (
          <>
            {/* Tools Section */}
            {tools.length > 0 && (
              <section className="mb-12 sm:mb-16">
                <div className="flex items-baseline gap-3 mb-5 sm:mb-6">
                  <h2
                    className="text-base sm:text-lg font-sans font-bold text-neutral-800"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {CATEGORY_TOOLS_NAME}
                  </h2>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {tools.length} {tools.length === 1 ? "Eintrag" : "Einträge"}
                  </span>
                  <div className="flex-1 border-b border-neutral-200 mb-1 hidden sm:block" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tools.map((tool, i) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      index={i}
                      onClick={() => setSelectedTool(tool)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Games Section */}
            {games.length > 0 && (
              <section className="mb-12 sm:mb-16">
                <div className="flex items-baseline gap-3 mb-5 sm:mb-6">
                  <h2
                    className="text-base sm:text-lg font-sans font-bold text-neutral-800"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {CATEGORY_GAMES_NAME}
                  </h2>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {games.length} {games.length === 1 ? "Eintrag" : "Einträge"}
                  </span>
                  <div className="flex-1 border-b border-neutral-200 mb-1 hidden sm:block" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:max-w-2xl">
                  {games.map((game, i) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      index={i}
                      onClick={() => setSelectedGame(game)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Keine Daten */}
            {tools.length === 0 && games.length === 0 && (
              <div className="text-center py-20 text-neutral-400">
                <p className="text-sm font-mono">Keine Dateien gefunden.</p>
                <p className="text-xs mt-2">
                  Stelle sicher, dass Dateien in den Ordnern "v/" und "g/" vorhanden sind.
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Disclaimer */}
      <div className="px-5 sm:px-10 lg:px-16 mt-8 sm:mt-12">
        <div className="border border-neutral-200 bg-white rounded-lg p-5 sm:p-6 max-w-3xl">
          <div className="flex items-start gap-3">
            <AlertTriangle size={16} className="text-neutral-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                Haftungsausschluss
              </h3>
              <p className="text-[12px] sm:text-[13px] text-neutral-400 leading-relaxed">
                Sämtliche auf dieser Seite angebotenen Tools und Dateien dienen
                <span className="text-neutral-600 font-medium"> ausschließlich zu Cybersecurity-Testing- und Bildungszwecken</span>.
                Die Nutzung erfolgt auf eigene Verantwortung. Der Anbieter übernimmt
                <span className="text-neutral-600 font-medium"> keinerlei Haftung </span>
                für Schäden, Datenverlust, rechtliche Konsequenzen oder sonstige
                Folgen, die durch den Einsatz der bereitgestellten Software entstehen.
                Mit dem Download bestätigst du, dass du die Tools nur in autorisierten
                Umgebungen und im Einklang mit geltendem Recht verwendest.
                Missbrauch jeglicher Art liegt in der alleinigen Verantwortung des Nutzers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer mit Admin-Panel */}
      <footer className="px-5 sm:px-10 lg:px-16 py-6 sm:py-8 mt-6">
        <div className="max-w-3xl">
          {/* Admin Panel */}
          <AdminPanel />

          {/* Copyright */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-6 border-t border-neutral-100 mt-4">
            <span className="text-[11px] font-mono text-neutral-400">
              depot/ — Nur für autorisierte Zwecke.
            </span>
            <span className="text-[11px] font-mono text-neutral-300">
              Alle Rechte vorbehalten.
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ToolModal tool={selectedTool} onClose={() => setSelectedTool(null)} />
      <GameModal game={selectedGame} onClose={() => setSelectedGame(null)} />
    </div>
  );
}
