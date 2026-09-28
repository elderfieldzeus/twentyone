"use client";

import { motion, useIsPresent } from "motion/react";

type PlayingCardProps = Readonly<{
  rank: string;
  suit: "clubs" | "diamonds" | "hearts" | "spades";
  hidden?: boolean;
  reducedMotion?: boolean;
}>;

const suitSymbols = { clubs: "♣", diamonds: "♦", hearts: "♥", spades: "♠" } as const;

export function PlayingCard({ rank, suit, hidden = false, reducedMotion = false }: PlayingCardProps) {
  const isPresent = useIsPresent();
  const motionProps = {
    animate: { opacity: 1, rotate: 0, rotateY: hidden ? 180 : 0, x: 0, y: 0 },
    exit: reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.92, y: -18 },
    initial: reducedMotion ? false : { opacity: 0, rotate: -4, x: 72, y: -54 },
    layout: !reducedMotion,
    transition: reducedMotion ? { duration: 0 } : { duration: 0.42, ease: "easeOut" as const },
  };

  if (hidden) {
    return <motion.div {...motionProps} aria-hidden={!isPresent || undefined} aria-label={isPresent ? "Hidden card" : undefined} className="card card-back" role={isPresent ? "img" : undefined}><span aria-hidden="true" className="card-back-mark">ⅡⅩ</span></motion.div>;
  }

  const symbol = suitSymbols[suit];
  const red = suit === "diamonds" || suit === "hearts";
  return (
    <motion.div {...motionProps} aria-hidden={!isPresent || undefined} aria-label={isPresent ? `${rank === "A" ? "Ace" : rank} of ${suit}` : undefined} className={`card ${red ? "card-red" : ""}`} role={isPresent ? "img" : undefined}>
      <span className="card-corner" aria-hidden="true"><strong>{rank}</strong><span>{symbol}</span></span>
      <span className="card-suit" aria-hidden="true">{symbol}</span>
    </motion.div>
  );
}
