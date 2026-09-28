import { PlayingCard } from "@/components/playing-card";

export default function Home() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#table" aria-label="Twentyone home"><span className="brand-chip" aria-hidden="true">21</span><span>Twentyone</span></a>
        <div className="session-stats" aria-label="Session summary"><span><b>0</b> hands</span><span><b>0%</b> accuracy</span></div>
        <button className="icon-button" type="button" aria-label="Open table settings">⚙</button>
      </header>
      <div className="game-layout">
        <section id="table" className="casino-table" aria-label="Blackjack table">
          <div className="table-rim" aria-hidden="true" />
          <div className="table-content">
            <section className="seat dealer-seat" aria-labelledby="dealer-title">
              <div className="seat-heading"><p className="eyebrow">House</p><h1 id="dealer-title">Dealer</h1></div>
              <div className="hand" aria-label="Dealer cards"><PlayingCard rank="A" suit="spades" /><PlayingCard rank="7" suit="diamonds" hidden /></div>
            </section>
            <div className="table-mark" aria-hidden="true"><span>Blackjack pays 3 to 2</span><b>Dealer stands on soft 17</b></div>
            <section className="seat player-seat" aria-labelledby="player-title">
              <div className="hand" aria-label="Player cards"><PlayingCard rank="10" suit="hearts" /><PlayingCard rank="6" suit="clubs" /></div>
              <div className="seat-heading"><p className="eyebrow">Player</p><h2 id="player-title">Your hand</h2></div>
            </section>
            <div className="action-dock" aria-label="Game controls"><button className="deal-button" type="button">Deal a hand</button><p>Practice table · No betting</p></div>
          </div>
        </section>
        <aside className="analysis-panel" aria-label="Move analysis">
          <div className="panel-heading"><div><p className="eyebrow">Live review</p><h2>Move analysis</h2></div><span className="status-dot">Ready</span></div>
          <div className="analysis-empty"><span className="analysis-icon" aria-hidden="true">✦</span><h3>Play without hints</h3><p>Your probabilities appear here after every decision.</p></div>
          <div className="panel-rule"><span>Table rules</span><strong>6 decks · S17</strong></div>
        </aside>
      </div>
    </main>
  );
}
