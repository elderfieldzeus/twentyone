"use client";

import { useState } from "react";

import { createShoe } from "@/lib/blackjack/cards";
import { applyAction, availableActions, createGame, defaultRules, type GameState, type PlayerAction } from "@/lib/blackjack/game";
import { scoreHand } from "@/lib/blackjack/hand";

import { PlayingCard } from "./playing-card";

const resultLabels = { blackjack: "Blackjack", win: "Win", push: "Push", loss: "Loss" } as const;

export function GameTable() {
  const [game, setGame] = useState<GameState | null>(null);

  function deal() {
    setGame(createGame(createShoe(defaultRules.deckCount), defaultRules));
  }

  function act(action: PlayerAction) {
    if (game) setGame(applyAction(game, action));
  }

  const actions = game ? availableActions(game) : [];
  const playerHand = game?.playerHands[game.activeHandIndex] ?? game?.playerHands[0];
  const result = game?.phase === "complete" ? game.settlements[0] : null;

  return (
    <section id="table" className="casino-table" aria-label="Blackjack table">
      <div className="table-rim" aria-hidden="true" />
      <div className="table-content">
        <section className="seat dealer-seat" aria-labelledby="dealer-title">
          <div className="seat-heading"><p className="eyebrow">House</p><h1 id="dealer-title">Dealer</h1></div>
          <div className="hand" aria-label="Dealer cards">
            {(game?.dealer.cards ?? []).map((card, index) => (
              <PlayingCard key={card.id} rank={card.rank} suit={card.suit} hidden={index === 1 && !game?.dealer.holeRevealed} />
            ))}
            {!game && <><PlayingCard rank="A" suit="spades" /><PlayingCard rank="7" suit="diamonds" hidden /></>}
          </div>
        </section>
        <div className="table-mark" aria-hidden="true"><span>Blackjack pays 3 to 2</span><b>Dealer stands on soft 17</b></div>
        <section className="seat player-seat" aria-labelledby="player-title">
          <div className="hand" aria-label="Player cards">
            {(playerHand?.cards ?? []).map((card) => <PlayingCard key={card.id} rank={card.rank} suit={card.suit} />)}
            {!game && <><PlayingCard rank="10" suit="hearts" /><PlayingCard rank="6" suit="clubs" /></>}
          </div>
          <div className="seat-heading">
            <p className="eyebrow">Player</p>
            <h2 id="player-title">Your hand{playerHand ? ` · ${scoreHand(playerHand.cards, { fromSplit: playerHand.fromSplit }).total}` : ""}</h2>
            {result && <p className={`hand-result result-${result.result}`} role="status">{resultLabels[result.result]}</p>}
          </div>
        </section>
        <div className="action-dock" aria-label="Game controls">
          {!game || game.phase === "complete" ? (
            <button className="deal-button" type="button" onClick={deal}>{game ? "Deal next hand" : "Deal a hand"}</button>
          ) : (
            <div className="action-buttons">
              {actions.includes("hit") && <button type="button" onClick={() => act("hit")}>Hit</button>}
              {actions.includes("stand") && <button type="button" onClick={() => act("stand")}>Stand</button>}
              {actions.includes("double") && <button type="button" onClick={() => act("double")}>Double down</button>}
            </div>
          )}
          <p>Practice table · No betting</p>
        </div>
      </div>
    </section>
  );
}
