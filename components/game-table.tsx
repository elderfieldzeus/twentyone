"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";

import { createShoe } from "@/lib/blackjack/cards";
import { applyAction, availableActions, createGame, defaultRules, type GameState, type PlayerAction } from "@/lib/blackjack/game";
import { scoreHand } from "@/lib/blackjack/hand";

import { PlayingCard } from "./playing-card";

const resultLabels = { blackjack: "Blackjack", win: "Win", push: "Push", loss: "Loss" } as const;

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function subscribeToPhoneLayout(onChange: () => void) {
  const query = window.matchMedia("(max-width: 599px)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getPhoneLayout() {
  return window.matchMedia("(max-width: 599px)").matches;
}

export function GameTable() {
  const [game, setGame] = useState<GameState | null>(null);
  const [clearing, setClearing] = useState(false);
  const [dealerPlaying, setDealerPlaying] = useState(false);
  const [openingDeal, setOpeningDeal] = useState(false);
  const [handPage, setHandPage] = useState(0);
  const [visibleDealerCount, setVisibleDealerCount] = useState(2);
  const [transitioning, setTransitioning] = useState(false);
  const dealerTimers = useRef<number[]>([]);
  const transitionTimer = useRef<number | null>(null);
  const reducedMotion = useSyncExternalStore(subscribeToReducedMotion, getReducedMotion, () => false);
  const phoneLayout = useSyncExternalStore(subscribeToPhoneLayout, getPhoneLayout, () => false);

  useEffect(() => () => {
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
    dealerTimers.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  function startTransition(duration = 450, onComplete?: () => void) {
    if (reducedMotion) {
      onComplete?.();
      return;
    }
    setTransitioning(true);
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
    transitionTimer.current = window.setTimeout(() => {
      setTransitioning(false);
      onComplete?.();
    }, duration);
  }

  function deal() {
    const dealNextHand = () => {
      setClearing(false);
      setDealerPlaying(false);
      setHandPage(0);
      setVisibleDealerCount(2);
      setOpeningDeal(true);
      startTransition(850, () => setOpeningDeal(false));
      setGame(createGame(createShoe(defaultRules.deckCount), defaultRules));
    };

    if (game && !reducedMotion) {
      setClearing(true);
      setTransitioning(true);
      if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
      transitionTimer.current = window.setTimeout(dealNextHand, 360);
      return;
    }

    dealNextHand();
  }

  function act(action: PlayerAction) {
    if (game && !transitioning) {
      startTransition();
      const nextGame = applyAction(game, action);
      setGame(nextGame);
      if (nextGame.phase === "player") {
        setHandPage(Math.floor(nextGame.activeHandIndex / (phoneLayout ? 1 : 2)));
      }

      if (nextGame.phase === "complete" && !reducedMotion) {
        setDealerPlaying(true);
        setVisibleDealerCount(2);
        dealerTimers.current.forEach((timer) => window.clearTimeout(timer));
        const dealerHits = nextGame.dealer.cards.slice(2);
        if (dealerHits.length === 0) {
          transitionTimer.current = window.setTimeout(() => setDealerPlaying(false), 450);
        } else {
          dealerTimers.current = dealerHits.map((_, index, cards) => window.setTimeout(() => {
            setVisibleDealerCount(index + 3);
            if (index === cards.length - 1) {
              transitionTimer.current = window.setTimeout(() => setDealerPlaying(false), 450);
            }
          }, (index + 1) * 550));
        }
      } else {
        setVisibleDealerCount(nextGame.dealer.cards.length);
        setDealerPlaying(false);
      }
    }
  }

  const actions = game ? availableActions(game) : [];
  const playerHand = game?.playerHands[game.activeHandIndex] ?? game?.playerHands[0];
  const displayedDealerCards = game?.dealer.cards.slice(0, visibleDealerCount);
  const visibleDealerCards = game?.dealer.holeRevealed ? displayedDealerCards : displayedDealerCards?.slice(0, 1);
  const dealerTotal = visibleDealerCards?.length ? scoreHand(visibleDealerCards).total : null;
  const handsPerPage = phoneLayout ? 1 : 2;
  const handCount = game?.playerHands.length ?? 0;
  const handPageCount = Math.max(1, Math.ceil(handCount / handsPerPage));
  const visibleHandPage = Math.min(handPage, handPageCount - 1);
  const activeHandPage = Math.floor((game?.activeHandIndex ?? 0) / handsPerPage);
  const viewingInactiveHands = game?.phase === "player" && visibleHandPage !== activeHandPage;
  const firstVisibleHand = visibleHandPage * handsPerPage;
  const lastVisibleHand = Math.min(firstVisibleHand + handsPerPage, handCount);
  const handPageLabel = lastVisibleHand - firstVisibleHand === 1
    ? `Hand ${firstVisibleHand + 1} of ${handCount}`
    : `Hands ${firstVisibleHand + 1}-${lastVisibleHand} of ${handCount}`;

  return (
    <section id="table" className="casino-table" aria-label="Blackjack table" data-dealer-state={dealerPlaying ? "playing" : "done"} data-game-state={clearing ? "clearing" : game ? "playing" : "idle"} data-motion={reducedMotion ? "reduced" : "standard"}>
      <div className="table-rim" aria-hidden="true" />
      <div className="table-content">
        <section className="seat dealer-seat" aria-labelledby="dealer-title">
          <div className="seat-heading"><p className="eyebrow">House</p><h1 id="dealer-title">Dealer{dealerTotal !== null ? ` · ${dealerTotal}` : ""}</h1></div>
          <div className="hand" aria-label="Dealer cards">
            <AnimatePresence mode="popLayout">
              {(game && !clearing ? game.dealer.cards.slice(0, visibleDealerCount) : []).map((card, index) => (
                <PlayingCard key={card.id} rank={card.rank} suit={card.suit} hidden={index === 1 && !game?.dealer.holeRevealed} fadeInPlace={index === 1 && game?.dealer.holeRevealed} reducedMotion={reducedMotion} dealOrder={openingDeal ? (index === 0 ? 1 : 3) : undefined} />
              ))}
            </AnimatePresence>
          </div>
        </section>
        <div className="table-mark" aria-hidden="true"><span>Blackjack pays 3 to 2</span><b>Dealer stands on soft 17</b></div>
        <section className="seat player-seat" aria-labelledby="player-title">
          <div className="hand-carousel">
            <div className="player-hands-window">
              <motion.div
                animate={{ x: `-${visibleHandPage * 100}%` }}
                className="player-hands-track"
                initial={false}
                transition={reducedMotion ? { duration: 0 } : { duration: 0.24, ease: "easeOut" }}
              >
                {game ? Array.from({ length: handPageCount }, (_, pageIndex) => (
                  <div aria-hidden={pageIndex !== visibleHandPage || undefined} className="player-hands" key={`hand-page-${pageIndex}`}>
                    {game.playerHands.slice(pageIndex * handsPerPage, (pageIndex + 1) * handsPerPage).map((hand, pageHandIndex) => {
                      const index = pageIndex * handsPerPage + pageHandIndex;
                      const isActive = game.phase === "player" && index === game.activeHandIndex;
                      const settlement = game.phase === "complete" && !dealerPlaying ? game.settlements[index] : null;
                      return (
                        <div
                          className={`player-hand${isActive ? " active-hand" : ""}`}
                          aria-label={game.playerHands.length === 1 ? "Player cards" : `Player hand ${index + 1}${isActive ? ", active" : ""}`}
                          key={`${hand.cards[0]?.id ?? "hand"}-${index}`}
                        >
                          <div className="hand">
                            <AnimatePresence mode="popLayout">
                              {!clearing && hand.cards.map((card, cardIndex) => <PlayingCard key={card.id} rank={card.rank} suit={card.suit} reducedMotion={reducedMotion} dealOrder={openingDeal ? cardIndex * 2 : undefined} />)}
                            </AnimatePresence>
                          </div>
                          {game.playerHands.length > 1 && <span className="hand-number">Hand {index + 1}</span>}
                          {settlement && <p className={`hand-result result-${settlement.result}`} role="status">{resultLabels[settlement.result]}</p>}
                        </div>
                      );
                    })}
                  </div>
                )) : <div className="player-hands"><div className="hand" aria-label="Player cards" /></div>}
              </motion.div>
            </div>
            {handCount > handsPerPage && (
              <nav aria-label="Player hand pages" className="hand-pagination">
                <button aria-label="Previous player hands" disabled={visibleHandPage === 0} onClick={() => setHandPage(visibleHandPage - 1)} type="button">‹</button>
                <span aria-live="polite">{handPageLabel}</span>
                <button aria-label="Next player hands" disabled={visibleHandPage === handPageCount - 1} onClick={() => setHandPage(visibleHandPage + 1)} type="button">›</button>
              </nav>
            )}
          </div>
          <div className="seat-heading">
            <p className="eyebrow">Player</p>
            <h2 id="player-title">Your hand{playerHand ? ` · ${scoreHand(playerHand.cards, { fromSplit: playerHand.fromSplit }).total}` : ""}</h2>
          </div>
        </section>
        <div className="action-dock" aria-label="Game controls">
          {clearing ? (
            <button className="deal-button" type="button" disabled>Clearing table</button>
          ) : dealerPlaying ? (
            <button className="deal-button" type="button" disabled>Dealer playing</button>
          ) : !game || game.phase === "complete" ? (
            <button className="deal-button" type="button" onClick={deal}>{game ? "Deal next hand" : "Deal a hand"}</button>
          ) : viewingInactiveHands ? (
            <div className="action-buttons"><button type="button" onClick={() => setHandPage(activeHandPage)}>Return to active hand</button></div>
          ) : (
            <div className="action-buttons">
              {actions.includes("stand") && <button type="button" disabled={transitioning} onClick={() => act("stand")}>Stand</button>}
              {actions.includes("hit") && <button type="button" disabled={transitioning} onClick={() => act("hit")}>Hit</button>}
              {actions.includes("double") && <button type="button" disabled={transitioning} onClick={() => act("double")}>Double down</button>}
              {actions.includes("split") && <button type="button" disabled={transitioning} onClick={() => act("split")}>Split</button>}
            </div>
          )}
          <p>Practice table · No betting</p>
        </div>
      </div>
    </section>
  );
}
