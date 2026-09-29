"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";

import { createShoe } from "@/lib/blackjack/cards";
import { applyAction, availableActions, createGame, defaultRules, type GameState, type PlayerAction, type TableRules } from "@/lib/blackjack/game";
import { scoreHand } from "@/lib/blackjack/hand";
import { formatOutcome, type MoveEvaluation } from "@/lib/blackjack/evaluate";

import { PlayingCard } from "./playing-card";

const resultLabels = { blackjack: "Blackjack", win: "Win", push: "Push", loss: "Loss" } as const;
const actionLabels = { stand: "Stand", hit: "Hit", double: "Double down", split: "Split" } as const;

type MoveFeedback = Readonly<{
  action: PlayerAction;
  evaluations: readonly MoveEvaluation[];
  handNumber: number;
  approximateActions?: readonly PlayerAction[];
}>;

type WorkerResult = Readonly<{ evaluations: MoveEvaluation[]; handNumber: number; action: PlayerAction; requestId: number; approximateActions: readonly PlayerAction[]; prepare?: boolean }>;

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
  const [rules, setRules] = useState<TableRules>(defaultRules);
  const [draftRules, setDraftRules] = useState<TableRules>(defaultRules);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [archiveNotice, setArchiveNotice] = useState("");
  const [game, setGame] = useState<GameState | null>(null);
  const [clearing, setClearing] = useState(false);
  const [dealerPlaying, setDealerPlaying] = useState(false);
  const [openingDeal, setOpeningDeal] = useState(false);
  const [handPage, setHandPage] = useState(0);
  const [visibleDealerCount, setVisibleDealerCount] = useState(2);
  const [transitioning, setTransitioning] = useState(false);
  const [feedback, setFeedback] = useState<MoveFeedback | null>(null);
  const dealerTimers = useRef<number[]>([]);
  const transitionTimer = useRef<number | null>(null);
  const analysisWorker = useRef<Worker | null>(null);
  const analysisRequestId = useRef(0);
  const preparedEvaluation = useRef<MoveEvaluation[] | null>(null);
  const preparingEvaluation = useRef(false);
  const pendingAction = useRef<{ action: PlayerAction; handNumber: number } | null>(null);
  const newShoe = useRef<ReturnType<typeof createShoe> | null>(null);
  const reducedMotion = useSyncExternalStore(subscribeToReducedMotion, getReducedMotion, () => false);
  const phoneLayout = useSyncExternalStore(subscribeToPhoneLayout, getPhoneLayout, () => false);

  useEffect(() => {
    const worker = new Worker(new URL("../lib/blackjack/evaluate-worker.ts", import.meta.url));
    worker.addEventListener("message", (event: MessageEvent<WorkerResult>) => {
      if (event.data.requestId !== analysisRequestId.current) return;
      if (event.data.prepare) {
        preparingEvaluation.current = false;
        const pending = pendingAction.current;
        if (pending) {
          setFeedback({ ...pending, evaluations: event.data.evaluations });
          pendingAction.current = null;
        } else preparedEvaluation.current = event.data.evaluations;
      }
      else setFeedback(event.data);
    });
    analysisWorker.current = worker;
    return () => {
      worker.terminate();
      if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
      dealerTimers.current.forEach((timer) => window.clearTimeout(timer));
    };
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
      setFeedback(null);
      const shoe = rules.shuffleAfterEachHand
        ? createShoe(rules.deckCount)
        : game?.shoe ?? newShoe.current ?? createShoe(rules.deckCount);
      const nextGame = createGame(shoe, rules);
      newShoe.current = nextGame.shoe;
      analysisRequestId.current += 1;
      preparedEvaluation.current = null;
      pendingAction.current = null;
      preparingEvaluation.current = false;
      setOpeningDeal(true);
      startTransition(850, () => {
        setOpeningDeal(false);
        if (!availableActions(nextGame).includes("split")) {
          preparingEvaluation.current = true;
          analysisWorker.current?.postMessage({ action: "hit", game: nextGame, handNumber: 1, requestId: analysisRequestId.current, prepare: true });
        }
      });
      setGame(nextGame);
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
      const handNumber = game.activeHandIndex + 1;
      setFeedback({ action, evaluations: [], handNumber });
      const prepared = preparedEvaluation.current;
      preparedEvaluation.current = null;
      if (prepared) {
        setFeedback({ action, evaluations: prepared, handNumber });
      } else if (preparingEvaluation.current) {
        pendingAction.current = { action, handNumber };
      } else {
        analysisRequestId.current += 1;
        analysisWorker.current?.postMessage({ action, game, handNumber, requestId: analysisRequestId.current });
      }
      startTransition();
      const nextGame = applyAction(game, action);
      newShoe.current = nextGame.shoe;
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

  function openOptions() {
    setDraftRules(rules);
    setOptionsOpen(true);
  }

  function applyOptions() {
    const archive = JSON.parse(window.localStorage.getItem("twentyone-session-archive") ?? "[]") as unknown[];
    archive.push({ archivedAt: new Date().toISOString(), game, rules });
    window.localStorage.setItem("twentyone-session-archive", JSON.stringify(archive));
    dealerTimers.current.forEach((timer) => window.clearTimeout(timer));
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
    analysisRequestId.current += 1;
    preparedEvaluation.current = null;
    pendingAction.current = null;
    preparingEvaluation.current = false;
    newShoe.current = createShoe(draftRules.deckCount);
    setRules(draftRules);
    setGame(null);
    setFeedback(null);
    setClearing(false);
    setDealerPlaying(false);
    setOpeningDeal(false);
    setTransitioning(false);
    setHandPage(0);
    setVisibleDealerCount(2);
    setArchiveNotice("Session archived. New shoe ready.");
    setOptionsOpen(false);
  }

  return <main className="app-shell">
    <header className="topbar">
      <a className="brand" href="#table" aria-label="Twentyone home"><span className="brand-chip" aria-hidden="true">21</span><span>Twentyone</span></a>
      <div className="session-stats" aria-label="Session summary"><span><b>0</b> hands</span><span><b>0%</b> accuracy</span></div>
      <button className="icon-button" type="button" aria-label="Table options" onClick={openOptions}>⚙</button>
    </header>
    {archiveNotice && <p className="mt-3 mb-[-8px] text-center text-[13px] text-[#8de0b7]" role="status">{archiveNotice}</p>}
    <div className="game-layout">
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
        <div className="table-mark" aria-hidden="true"><span>Blackjack pays {rules.blackjackPayout === "3:2" ? "3 to 2" : "6 to 5"}</span><b>Dealer {rules.dealerStandsOnSoft17 ? "stands" : "hits"} on soft 17</b></div>
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
    {feedback && (
      <aside className="analysis-panel" aria-label="Move analysis" role="region">
        <div className="panel-heading">
          <div><p className="eyebrow">Live review</p><h2>Move analysis</h2></div>
          <span className="status-dot">Reviewed</span>
        </div>
        <div className="analysis-results">
          <div className="analysis-summary">
            <p>{game && game.playerHands.length > 1 ? `Hand ${feedback.handNumber}` : "Your decision"}</p>
            <h3>Selected move: {actionLabels[feedback.action]}</h3>
            <p className="selected-grade">{feedback.evaluations.length > 0
              ? `Selected move grade: ${feedback.evaluations.find((evaluation) => evaluation.action === feedback.action)?.grade}`
              : "Calculating results"}</p>
          </div>
          <div className="move-results">
            {feedback.evaluations.map((evaluation) => {
              const outcome = formatOutcome(evaluation.outcome);
              return (
                <section className={`move-result${evaluation.action === feedback.action ? " selected-move" : ""}`} aria-label={actionLabels[evaluation.action]} key={evaluation.action} role="group">
                  <div className="move-result-heading">
                    <h4>{actionLabels[evaluation.action]}</h4>
                    <div className="move-labels">
                      {feedback.approximateActions?.includes(evaluation.action) && <span>Estimated</span>}
                      {evaluation.grade === "Best move" && <span>Best prior move</span>}
                      {evaluation.action === feedback.action && <span>Selected</span>}
                    </div>
                  </div>
                  {feedback.approximateActions?.includes(evaluation.action) && <p className="move-estimate">Representative shoe sample</p>}
                  <dl>
                    <div><dt>Win </dt><dd>{outcome.win}</dd></div>
                    <div><dt>Push </dt><dd>{outcome.push}</dd></div>
                    <div><dt>Loss </dt><dd>{outcome.loss}</dd></div>
                    <div><dt>Expected value </dt><dd>{outcome.expectedValue}</dd></div>
                  </dl>
                </section>
              );
            })}
          </div>
        </div>
        <div className="panel-rule"><span>Table rules</span><strong>{rules.deckCount} {rules.deckCount === 1 ? "deck" : "decks"} · {rules.dealerStandsOnSoft17 ? "S17" : "H17"} · {rules.dealerHasHoleCard ? "Hole card" : "No hole card"}</strong></div>
      </aside>
    )}
    </div>
    {optionsOpen && (
      <div className="fixed inset-0 z-20 grid place-items-center bg-[#020805c7] p-5" onMouseDown={(event) => event.target === event.currentTarget && setOptionsOpen(false)}>
        <section className="max-h-[calc(100vh-40px)] w-full max-w-[620px] overflow-auto rounded-[18px] border border-[#d8ba6f66] bg-[#101a16] p-[26px] shadow-[0_28px_90px_#000b] max-[820px]:p-[22px_18px]" role="dialog" aria-label="Table options" aria-modal="true">
          <div className="mb-[22px] flex items-start justify-between"><div><p className="eyebrow">Game setup</p><h2 className="mt-1 mb-0 font-serif text-[28px] font-medium">Table options</h2></div><button className="h-[38px] w-[38px] rounded-full border border-[#ffffff24] bg-transparent text-2xl text-[#d8e1dc] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#f5d47e]" type="button" aria-label="Close table options" onClick={() => setOptionsOpen(false)}>×</button></div>
          <div className="grid grid-cols-2 gap-4 max-[820px]:grid-cols-1">
            <label className="grid gap-[7px] text-xs text-[#b9c9c1]">Deck count<select className="w-full rounded-lg border border-[#ffffff24] bg-[#172720] px-3 py-[11px] text-[#f7f0df] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#f5d47e]" value={draftRules.deckCount} onChange={(event) => setDraftRules({ ...draftRules, deckCount: Number(event.target.value) })}><option value="1">1</option><option value="2">2</option><option value="4">4</option><option value="6">6</option><option value="8">8</option></select></label>
            <label className="grid gap-[7px] text-xs text-[#b9c9c1]">Soft 17<select className="w-full rounded-lg border border-[#ffffff24] bg-[#172720] px-3 py-[11px] text-[#f7f0df] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#f5d47e]" value={draftRules.dealerStandsOnSoft17 ? "stand" : "hit"} onChange={(event) => setDraftRules({ ...draftRules, dealerStandsOnSoft17: event.target.value === "stand" })}><option value="stand">Dealer stands</option><option value="hit">Dealer hits</option></select></label>
            <label className="grid gap-[7px] text-xs text-[#b9c9c1]">Maximum split hands<select className="w-full rounded-lg border border-[#ffffff24] bg-[#172720] px-3 py-[11px] text-[#f7f0df] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#f5d47e]" value={draftRules.maxSplitHands} onChange={(event) => setDraftRules({ ...draftRules, maxSplitHands: Number(event.target.value) })}><option value="2">2</option><option value="3">3</option><option value="4">4</option></select></label>
            <label className="grid gap-[7px] text-xs text-[#b9c9c1]">Blackjack payout<select className="w-full rounded-lg border border-[#ffffff24] bg-[#172720] px-3 py-[11px] text-[#f7f0df] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#f5d47e]" value={draftRules.blackjackPayout} onChange={(event) => setDraftRules({ ...draftRules, blackjackPayout: event.target.value as TableRules["blackjackPayout"] })}><option value="3:2">3:2</option><option value="6:5">6:5</option></select></label>
          </div>
          <div className="mt-[22px] grid grid-cols-2 gap-[14px] rounded-[10px] bg-[#ffffff06] p-[18px] max-[820px]:grid-cols-1">
            <label className="flex items-center gap-[10px] text-[13px] text-[#d8e1dc]"><input className="h-[18px] w-[18px] accent-[#d5ad5f] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#f5d47e]" type="checkbox" checked={draftRules.shuffleAfterEachHand} onChange={(event) => setDraftRules({ ...draftRules, shuffleAfterEachHand: event.target.checked })} />Shuffle after each hand</label>
            <label className="flex items-center gap-[10px] text-[13px] text-[#d8e1dc]"><input className="h-[18px] w-[18px] accent-[#d5ad5f] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#f5d47e]" type="checkbox" checked={draftRules.dealerHasHoleCard} onChange={(event) => setDraftRules({ ...draftRules, dealerHasHoleCard: event.target.checked })} />Dealer hole card</label>
            <label className="flex items-center gap-[10px] text-[13px] text-[#d8e1dc]"><input className="h-[18px] w-[18px] accent-[#d5ad5f] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#f5d47e]" type="checkbox" checked={draftRules.doubleAfterSplit} onChange={(event) => setDraftRules({ ...draftRules, doubleAfterSplit: event.target.checked })} />Double after split</label>
            <label className="flex items-center gap-[10px] text-[13px] text-[#d8e1dc]"><input className="h-[18px] w-[18px] accent-[#d5ad5f] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#f5d47e]" type="checkbox" checked={draftRules.resplitAces} onChange={(event) => setDraftRules({ ...draftRules, resplitAces: event.target.checked })} />Repeated ace splits</label>
          </div>
          <div className="mt-6 flex justify-end gap-[10px]"><button className="rounded-full border border-[#d8ba6f] bg-transparent px-[18px] py-[11px] font-bold text-[#f4dfaa] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#f5d47e]" type="button" onClick={() => setOptionsOpen(false)}>Cancel</button><button className="rounded-full border border-[#d8ba6f] bg-[#d5ad5f] px-[18px] py-[11px] font-bold text-[#1c160b] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#f5d47e]" type="button" onClick={applyOptions}>Apply options</button></div>
        </section>
      </div>
    )}
  </main>;
}
