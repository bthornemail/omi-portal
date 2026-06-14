import { useCallback, useRef, useState } from 'react';
import type { InfraRunRecord, InfraRunStatus } from './narrativeTypes';
import { makeOmiRunRecord, isTargetRunnable } from '../omi/infraRunner';

type RunState = {
  record: InfraRunRecord;
  active: boolean;
};

export function useInfraRunner() {
  const [runs, setRuns] = useState<Map<string, RunState>>(() => new Map());
  const esRef = useRef<Map<string, EventSource>>(new Map());

  const runTarget = useCallback(async (target: string) => {
    if (!isTargetRunnable(target)) return;

    const record = makeOmiRunRecord(target, 'candidate');
    setRuns(prev => {
      const next = new Map(prev);
      next.set(target, { record, active: true });
      return next;
    });

    try {
      const resp = await fetch('/api/infra/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target })
      });

      if (!resp.ok) {
        const err = await resp.json();
        setRuns(prev => {
          const next = new Map(prev);
          const r = next.get(target);
          if (r) {
            r.record.status = 'failed';
            r.record.stderr.push(err.error || 'HTTP error');
            r.record.finishedAt = Date.now();
            r.active = false;
          }
          return next;
        });
        return;
      }

      const { id } = await resp.json();

      const es = new EventSource(`/api/infra/events/${id}`);

      es.addEventListener('stdout', (e) => {
        const { line } = JSON.parse(e.data);
        setRuns(prev => {
          const next = new Map(prev);
          const r = next.get(target);
          if (r) r.record.stdout.push(line);
          return next;
        });
      });

      es.addEventListener('stderr', (e) => {
        const { line } = JSON.parse(e.data);
        setRuns(prev => {
          const next = new Map(prev);
          const r = next.get(target);
          if (r) r.record.stderr.push(line);
          return next;
        });
      });

      es.addEventListener('complete', (e) => {
        const { status, exitCode } = JSON.parse(e.data);
        setRuns(prev => {
          const next = new Map(prev);
          const r = next.get(target);
          if (r) {
            r.record.status = status as InfraRunStatus;
            r.record.exitCode = exitCode ?? -1;
            r.record.finishedAt = Date.now();
            r.active = false;
          }
          return next;
        });
        es.close();
      });

      es.addEventListener('error', (e) => {
        const msg = (e as MessageEvent).data ? JSON.parse((e as MessageEvent).data) : { message: 'SSE error' };
        setRuns(prev => {
          const next = new Map(prev);
          const r = next.get(target);
          if (r) {
            r.record.status = 'failed';
            r.record.stderr.push(msg.message || 'SSE error');
            r.record.finishedAt = Date.now();
            r.active = false;
          }
          return next;
        });
        es.close();
      });

      esRef.current.set(target, es);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setRuns(prev => {
        const next = new Map(prev);
        const r = next.get(target);
        if (r) {
          r.record.status = 'failed';
          r.record.stderr.push(msg);
          r.record.finishedAt = Date.now();
          r.active = false;
        }
        return next;
      });
    }
  }, []);

  const getRun = useCallback((target: string): RunState | undefined => {
    return runs.get(target);
  }, [runs]);

  return { runs, runTarget, getRun };
}
