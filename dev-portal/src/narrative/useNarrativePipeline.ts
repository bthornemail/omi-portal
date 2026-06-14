import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createNarrativePipeline,
  snapshotNarrativeProjection,
  type NarrativePipeline
} from './adapter';
import { buildSurfaceCommentDeclarations } from './narrativeProjectionAdapter';
import type { NarrativeProjectionState, ReceiptState, SurfaceCommentDeclaration } from './narrativeTypes';

export type NarrativePlaybackControls = {
  togglePlayback: () => void;
  stepBeat: (delta: number) => void;
  scrubTick: (tick: number) => void;
  stepTick: (delta: number) => void;
  scrubMotif: (motif: string) => void;
};

export function useNarrativePipeline(onStatus?: (message: string) => void) {
  const pipelineRef = useRef<NarrativePipeline | null>(null);
  const [projectionState, setProjectionState] = useState<NarrativeProjectionState>(() => snapshotNarrativeProjection(null));
  const [receiptStates, setReceiptStates] = useState<Map<string, ReceiptState>>(() => new Map());
  const [inspectedDeclaration, setInspectedDeclaration] = useState<SurfaceCommentDeclaration | null>(null);
  const [lastCandidateId, setLastCandidateId] = useState<string | null>(null);

  function syncProjection(playing = pipelineRef.current?.player.playing ?? false) {
    setProjectionState(snapshotNarrativeProjection(pipelineRef.current, playing));
  }

  useEffect(() => {
    const pipeline = createNarrativePipeline();
    pipelineRef.current = pipeline;
    setProjectionState(snapshotNarrativeProjection(pipeline, false));
    onStatus?.(`Narrative pipeline ready: ${pipeline.timeline.beatCount} beats projected.`);

    const id = window.setInterval(() => {
      if (pipeline.player.playing) setProjectionState(snapshotNarrativeProjection(pipeline, true));
    }, 250);

    return () => {
      window.clearInterval(id);
      pipeline.player.destroy();
      pipelineRef.current = null;
    };
  }, [onStatus]);

  const declarations = useMemo(
    () => buildSurfaceCommentDeclarations({
      beat: projectionState.beat,
      beatIndex: projectionState.beatIndex,
      tick: projectionState.tick,
      receiptStates
    }),
    [projectionState.beat, projectionState.beatIndex, projectionState.tick, receiptStates]
  );

  const playbackControls: NarrativePlaybackControls = {
    togglePlayback() {
      const player = pipelineRef.current?.player;
      if (!player) return;
      if (player.playing) {
        player.pause();
        syncProjection(false);
        onStatus?.('Narrative projection paused.');
      } else {
        player.play();
        syncProjection(true);
        onStatus?.('Narrative projection playing.');
      }
    },
    stepBeat(delta: number) {
      const player = pipelineRef.current?.player;
      if (!player) return;
      if (delta > 0) player.nextBeat();
      else player.previousBeat();
      syncProjection(player.playing);
    },
    scrubTick(tick: number) {
      const pipeline = pipelineRef.current;
      if (!pipeline) return;
      pipeline.clock.scrubToTick(tick);
      const beatCount = Math.max(1, pipeline.timeline.beatCount);
      const beatIndex = Math.min(beatCount - 1, Math.floor((tick / 5040) * beatCount));
      pipeline.player.scrubToBeat(beatIndex);
      syncProjection(pipeline.player.playing);
    },
    stepTick(delta: number) {
      const player = pipelineRef.current?.player;
      if (!player) return;
      if (delta > 0) {
        player.advanceTick();
        syncProjection(player.playing);
      } else {
        playbackControls.scrubTick(Math.max(0, projectionState.tick + delta));
      }
    },
    scrubMotif(motif: string) {
      const player = pipelineRef.current?.player;
      if (!player) return;
      player.scrubToMotif(motif);
      syncProjection(player.playing);
      onStatus?.(`Narrative motif projection: ${motif}.`);
    }
  };

  function onInspectDeclaration(declaration: SurfaceCommentDeclaration) {
    setInspectedDeclaration(declaration);
    onStatus?.(`Inspecting projection ${declaration.projection.id}.`);
  }

  function onReceiptCandidate(projection: SurfaceCommentDeclaration['projection']) {
    setReceiptStates((current) => {
      const next = new Map(current);
      next.set(projection.id, 'candidate');
      return next;
    });
    setLastCandidateId(projection.id);
    onStatus?.(`Receipt candidate emitted for ${projection.id}.`);
  }

  return {
    projectionState,
    declarations,
    playbackControls,
    inspectedDeclaration,
    lastCandidateId,
    onInspectDeclaration,
    onReceiptCandidate
  };
}
