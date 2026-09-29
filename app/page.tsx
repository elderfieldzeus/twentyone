import { GameTable } from "@/components/game-table";

export default function Home() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#table" aria-label="Twentyone home"><span className="brand-chip" aria-hidden="true">21</span><span>Twentyone</span></a>
        <div className="session-stats" aria-label="Session summary"><span><b>0</b> hands</span><span><b>0%</b> accuracy</span></div>
        <button className="icon-button" type="button" aria-label="Open table settings">⚙</button>
      </header>
      <div className="game-layout">
        <GameTable />
      </div>
    </main>
  );
}
