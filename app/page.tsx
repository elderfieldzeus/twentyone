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
        <aside className="analysis-panel" aria-label="Move analysis">
          <div className="panel-heading"><div><p className="eyebrow">Live review</p><h2>Move analysis</h2></div><span className="status-dot">Ready</span></div>
          <div className="analysis-empty"><span className="analysis-icon" aria-hidden="true">✦</span><h3>Play without hints</h3><p>Your probabilities appear here after every decision.</p></div>
          <div className="panel-rule"><span>Table rules</span><strong>6 decks · S17</strong></div>
        </aside>
      </div>
    </main>
  );
}
