import React, { useRef, useState } from 'react';
import type { OmiCarrier } from './carrier';
import { createAcceptedOmiWorker, type OmiWorkerHandle } from './worker';
import { OmiSurface } from './OmiSurface';

export type OmiWorkerEvent = {
  type: 'omi-worker-event';
  carrierId: string;
  address: string;
  surface: string;
  payload: unknown;
};

type OmiWorkerSurfaceProps = {
  carrier: OmiCarrier;
  onEvent?: (event: OmiWorkerEvent) => void;
};

export function OmiWorkerSurface({ carrier, onEvent }: OmiWorkerSurfaceProps) {
  const workerRef = useRef<OmiWorkerHandle | null>(null);
  const [state, setState] = useState<'idle' | 'active' | 'blocked' | 'error'>('idle');

  function activate() {
    if (carrier.receiptState !== 'accepted') {
      setState('blocked');
      return;
    }

    try {
      workerRef.current?.worker.terminate();
      workerRef.current?.revoke();
      const handle = createAcceptedOmiWorker(carrier, { type: 'module', name: carrier.id });
      workerRef.current = handle;
      handle.worker.onmessage = (ev) => {
        onEvent?.({
          type: 'omi-worker-event',
          carrierId: carrier.id,
          address: carrier.address,
          surface: carrier.surface,
          payload: ev.data,
        });
      };
      handle.worker.onerror = () => setState('error');
      handle.worker.postMessage({
        type: 'omi:start',
        address: carrier.address,
        oWord: carrier.oWord,
        surface: carrier.surface,
      });
      setState('active');
    } catch {
      setState('error');
    }
  }

  return (
    <OmiSurface carrier={carrier} surface={carrier.surface} className="omi-worker-surface" title="Omi-Worker">
      <button
        type="button"
        className="tq-mode-btn"
        disabled={carrier.receiptState !== 'accepted'}
        onClick={activate}
      >
        Activate OMI Worker
      </button>
      <span className="omi-worker-state">{state}</span>
    </OmiSurface>
  );
}
