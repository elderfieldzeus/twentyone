type PlayingCardProps = Readonly<{
  rank: string;
  suit: "clubs" | "diamonds" | "hearts" | "spades";
  hidden?: boolean;
}>;

const suitSymbols = { clubs: "♣", diamonds: "♦", hearts: "♥", spades: "♠" } as const;

export function PlayingCard({ rank, suit, hidden = false }: PlayingCardProps) {
  if (hidden) {
    return <div aria-label="Hidden card" className="card card-back" role="img"><span aria-hidden="true" className="card-back-mark">ⅡⅩ</span></div>;
  }

  const symbol = suitSymbols[suit];
  const red = suit === "diamonds" || suit === "hearts";
  return (
    <div aria-label={`${rank === "A" ? "Ace" : rank} of ${suit}`} className={`card ${red ? "card-red" : ""}`} role="img">
      <span className="card-corner" aria-hidden="true"><strong>{rank}</strong><span>{symbol}</span></span>
      <span className="card-suit" aria-hidden="true">{symbol}</span>
    </div>
  );
}
