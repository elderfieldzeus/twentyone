"use client";

import { motion, useIsPresent } from "motion/react";

type PlayingCardProps = Readonly<{
  rank: string;
  suit: "clubs" | "diamonds" | "hearts" | "spades";
  hidden?: boolean;
  reducedMotion?: boolean;
  dealOrder?: number;
}>;

const suitSymbols = { clubs: "♣", diamonds: "♦", hearts: "♥", spades: "♠" } as const;

export function PlayingCard({ rank, suit, hidden = false, reducedMotion = false, dealOrder }: PlayingCardProps) {
  const isPresent = useIsPresent();
  const motionProps = {
    animate: { opacity: 1, rotate: 0, rotateY: hidden ? 180 : 0, x: 0, y: 0 },
    exit: reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.92, transition: { delay: 0, duration: 0.32 }, y: -18 },
    initial: reducedMotion ? false : { opacity: 0, rotate: hidden ? 0 : -4, rotateY: hidden ? 180 : 0, x: hidden ? 180 : 72, y: hidden ? -120 : -54 },
    layout: !reducedMotion,
    transition: reducedMotion ? { duration: 0 } : { delay: dealOrder === undefined ? 0 : dealOrder * 0.2, duration: hidden ? 0.62 : 0.42, ease: "easeOut" as const },
  };

  const symbol = suitSymbols[suit];
  const red = suit === "diamonds" || suit === "hearts";
  return (
    <motion.div {...motionProps} aria-hidden={!isPresent || undefined} aria-label={isPresent ? (hidden ? "Hidden card" : `${rank === "A" ? "Ace" : rank} of ${suit}`) : undefined} className={`card ${red ? "card-red" : ""}`} data-deal-order={dealOrder} role={isPresent ? "img" : undefined}>
      {!hidden && (
        <span className="card-face card-face-front">
          <span className="card-corner" aria-hidden="true"><strong>{rank}</strong><span>{symbol}</span></span>
          <span className="card-suit" aria-hidden="true">{symbol}</span>
        </span>
      )}
      <span className="card-face card-face-back" aria-hidden="true"><span className="card-back-mark">ⅡⅩ</span></span>
    </motion.div>
  );
}
