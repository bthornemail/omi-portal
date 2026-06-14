import { base64ToBytes, type OmiCarrier } from './omiSurfaceCarrier';

export type OmiWorkerHandle = {
  worker: Worker;
  url: string;
  bytes: Uint8Array;
  revoke: () => void;
};

export function base64ToWorker(carrier: Pick<OmiCarrier, 'base64' | 'mime'>, options: WorkerOptions = { type: 'module' }): OmiWorkerHandle {
  const bytes = base64ToBytes(carrier.base64);
  const blobBytes = new Uint8Array(bytes);
  const blob = new Blob([blobBytes], { type: carrier.mime || 'application/javascript' });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url, { type: options.type ?? 'module', name: options.name });
  return {
    worker,
    url,
    bytes,
    revoke: () => URL.revokeObjectURL(url),
  };
}

export function createAcceptedOmiWorker(carrier: OmiCarrier, options: WorkerOptions = { type: 'module' }): OmiWorkerHandle {
  if (carrier.receiptState !== 'accepted') {
    throw new Error('Cannot execute unaccepted OMI carrier');
  }
  return base64ToWorker(carrier, options);
}
