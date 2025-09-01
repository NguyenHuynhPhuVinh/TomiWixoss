"use client";
import useGameStore from "@/store/gameStore";
import { useStore } from "zustand";
import { Button } from "./button";
import { world, globalEntity } from "@/logic/ecs/world.miniplex";
import { Entity } from "@/logic/ecs/types.miniplex";
import {
  advancePhaseAction,
  startSetupAction,
  confirmMulliganAction,
} from "@/logic/actions.miniplex";
import { GamePhase, Zone } from "@/logic/constants";
import { cancelPlayerActionInECS } from "@/logic/actions.miniplex";
import { useTranslation } from "react-i18next"; // Import hook

export default function GameController() {
  const { t } = useTranslation(); // Sử dụng hook
  useStore(useGameStore, (state) => state.worldVersion);

  const phase = globalEntity.globalState?.phase;
  const turn = globalEntity.globalState?.turn;
  const actionTakenInPhase = globalEntity.globalState?.actionTakenInPhase;
  const mulliganSelectionCount =
    globalEntity.globalState?.mulliganSelection.length ?? 0;
  const playerAction = globalEntity.globalState?.playerAction;

  const mustDiscard = useStore(useGameStore, (state) => state.mustDiscard);
  const openZoneViewer = useGameStore((state) => state.openZoneViewer);

  const renderContent = () => {
    if (playerAction?.type === "place_signi") {
      return (
        <>
          <p className="text-sm text-blue-400 mb-2 animate-pulse">
            {t("gameController.placeSigniPrompt")}
          </p>
          <Button
            onClick={cancelPlayerActionInECS}
            variant="destructive"
            size="sm"
            className="w-full mt-2"
          >
            {t("gameController.cancelButton")}
          </Button>
        </>
      );
    }

    const phaseText = phase
      ? phase.charAt(0).toUpperCase() + phase.slice(1)
      : "Loading...";
    const phaseTitle = t("gameController.phaseTitle", {
      turn: turn,
      phase: phaseText,
    });

    switch (phase) {
      case GamePhase.PRE_GAME:
        return (
          <Button onClick={startSetupAction}>
            {t("gameController.prepareButton")}
          </Button>
        );

      case GamePhase.SELECTING_LRIGS:
        return (
          <p className="text-muted-foreground animate-pulse">
            {t("gameController.selectingLrigs")}
          </p>
        );

      case GamePhase.UP:
      case GamePhase.DRAW:
        return (
          <>
            <h3 className="font-bold">{phaseTitle}</h3>
            <p className="text-muted-foreground animate-pulse mt-4">
              {t("gameController.autoPhase")}
            </p>
          </>
        );

      case GamePhase.ENER:
        return (
          <>
            <h3 className="font-bold">{phaseTitle}</h3>
            {actionTakenInPhase ? (
              <p className="text-sm text-green-500 my-2">
                {t("gameController.enerCharged")}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground my-2">
                {t("gameController.enerPrompt")}
              </p>
            )}
            <Button
              onClick={() => advancePhaseAction()}
              className="w-full mt-2"
            >
              {t("gameController.nextPhaseButton")}
            </Button>
          </>
        );

      case GamePhase.MULLIGAN:
        return (
          <>
            <p className="text-muted-foreground mb-4">
              {t("gameController.mulliganPrompt")}
              <br />
              <span className="font-bold">
                {t("gameController.mulliganSelected", {
                  count: mulliganSelectionCount,
                })}
              </span>
            </p>
            <Button onClick={confirmMulliganAction} className="w-full">
              {t("gameController.mulliganConfirm")}
            </Button>
          </>
        );

      case GamePhase.GROW:
        return (
          <>
            <h3 className="font-bold">{phaseTitle}</h3>
            {actionTakenInPhase ? (
              <p className="text-sm text-green-500 my-2">
                {t("gameController.growDone")}
              </p>
            ) : (
              <Button
                onClick={openZoneViewer}
                className="w-full mt-2"
                variant="secondary"
              >
                {t("gameController.viewLrigDeck")}
              </Button>
            )}
            <Button
              onClick={() => advancePhaseAction()}
              className="w-full mt-2"
            >
              {t("gameController.nextPhaseButton")}
            </Button>
          </>
        );

      case GamePhase.END:
        const handSize = world
          ? Array.from(
              world
                .with("zone")
                .where((e: Entity) => e.zone?.zone === Zone.HAND)
            ).length
          : 0;
        return (
          <>
            <h3 className="font-bold">{phaseTitle}</h3>
            {mustDiscard && (
              <p className="text-destructive text-sm my-2">
                {t("gameController.endPhaseDiscard", {
                  handSize: handSize,
                  discardCount: handSize - 6,
                })}
              </p>
            )}
            <Button
              onClick={() => advancePhaseAction()}
              className="w-full mt-2"
              disabled={mustDiscard}
            >
              {t("gameController.endTurnButton")}
            </Button>
          </>
        );
      default:
        return (
          <>
            <h3 className="font-bold">{phaseTitle}</h3>
            <Button
              onClick={() => advancePhaseAction()}
              className="w-full mt-2"
            >
              {t("gameController.nextPhaseButton")}
            </Button>
          </>
        );
    }
  };

  if (phase === GamePhase.PRE_GAME) {
    return (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card p-6 rounded-lg shadow-lg z-10 border text-center pointer-events-auto">
        <h2 className="text-2xl font-bold mb-2 text-card-foreground">
          {t("appName")}
        </h2>
        <p className="text-muted-foreground mb-6">
          {t("gameController.welcomeSubtitle")}
        </p>
        <Button onClick={startSetupAction} className="w-full" size="lg">
          {t("gameController.prepareButton")}
        </Button>
      </div>
    );
  }

  return (
    <div className="absolute top-4 right-4 bg-card p-4 rounded-lg shadow-lg z-10 border w-56 text-center pointer-events-auto">
      {renderContent()}
    </div>
  );
}
