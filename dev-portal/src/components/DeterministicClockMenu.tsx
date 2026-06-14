import { useMemo, useState } from 'react';
import { computeClockState, composeOmiCarrier, receiptCandidateImo, resolveURN, safeBase64, slot5040 } from '../omi/omiCarrier';
import type { NarrativePlaybackControls } from '../narrative/useNarrativePipeline';
import type { NarrativeProjectionState } from '../narrative/narrativeTypes';

type ProtocolId = 'mqtt' | 'http' | 'ws' | 'sse' | 'rtc';

type RouterStats = {
  sent: number;
  recv: number;
  err: number;
  lat?: number;
};

const PROTOCOLS: ProtocolId[] = ['mqtt', 'http', 'ws', 'sse', 'rtc'];

type DeterministicClockMenuProps = {
  projectionState: NarrativeProjectionState;
  playbackControls: NarrativePlaybackControls;
};

export function DeterministicClockMenu({ projectionState, playbackControls }: DeterministicClockMenuProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [protocols, setProtocols] = useState<Record<ProtocolId, boolean>>({
    mqtt: false,
    http: false,
    ws: false,
    sse: false,
    rtc: false
  });
  const [stats, setStats] = useState<RouterStats>({ sent: 0, recv: 0, err: 0 });
  const clock = useMemo(() => computeClockState(projectionState.tick), [projectionState.tick]);
  const tickUrn = useMemo(() => resolveURN(clock.A, Number(clock.t6 & 15n), 0x1f), [clock]);
  const tockUrn = useMemo(() => resolveURN(clock.B, Number(clock.t5 & 15n), 0x1c), [clock]);
  const activeProtocolCount = Object.values(protocols).filter(Boolean).length;
  const motifs = projectionState.beat?.motifs ?? [];

  function routeFrame(nextTick: number) {
    const nextClock = computeClockState(nextTick);
    setStats((current) => ({
      sent: current.sent + 1,
      recv: current.recv + (activeProtocolCount > 0 && nextTick % 3 === 0 ? 1 : 0),
      err: current.err + (activeProtocolCount === 0 && nextTick > 0 ? 1 : 0),
      lat: 10 + ((nextClock.A + nextClock.B + activeProtocolCount * 7) % 40)
    }));
  }

  function setClockTick(value: number) {
    const nextTick = Math.min(5039, Math.max(0, Math.trunc(value)));
    playbackControls.scrubTick(nextTick);
    routeFrame(nextTick);
  }

  function stepClock(delta: number) {
    playbackControls.stepTick(delta);
    routeFrame(projectionState.tick + delta);
  }

  function toggleProtocol(protocol: ProtocolId) {
    setProtocols((current) => {
      const next = { ...current, [protocol]: !current[protocol] };
      if (!current[protocol]) setStats((statsNow) => ({ ...statsNow, recv: statsNow.recv + 1 }));
      return next;
    });
  }

  return (
    <section
      className={`panel clock-router clock-router-panel${collapsed ? ' collapsed' : ''}`}
      data-omi={composeOmiCarrier('clock-router', 12, 'control')}
      data-imo={receiptCandidateImo()}
      data-beat={projectionState.ready ? String(projectionState.beatIndex + 1) : '0'}
      data-phase={projectionState.beat?.phase ?? 'loading'}
    >
      <button
        className="clock-router-header"
        type="button"
        aria-expanded={!collapsed}
        onClick={() => setCollapsed((value) => !value)}
      >
        <span>DETERMINISTIC CLOCK ROUTER</span>
        <strong>{tickUrn.executable ? 'R' : 'L'}</strong>
      </button>

      {!collapsed && (
        <div className="clock-router-body">
          <div className="clock-card">
            <div className="clock-row">
              <span className="clock-label">TICK / slot5040</span>
              <span className="clock-value">{clock.tick} / {slot5040(clock.tick)}</span>
              <button type="button" className="mini-btn" onClick={() => stepClock(1)}>step</button>
            </div>
            <div className="clock-row">
              <span className="clock-label">epoch / beat</span>
              <span className="clock-value">e{projectionState.epoch} · {projectionState.beatIndex + 1}/{projectionState.beatCount}</span>
            </div>
            <div className="clock-row">
              <span className="clock-label">phase / gate</span>
              <span className="clock-value">{projectionState.beat?.phaseEmoji ?? ''} {projectionState.beat?.phase ?? 'loading'} · {projectionState.gateState}</span>
            </div>
            <div className="clock-row">
              <span className="clock-label">IPv6 (::8)</span>
              <span className="clock-value ip-highlight">{clock.ip6}</span>
            </div>
            <div className="clock-row">
              <span className="clock-label">IPv4 / CIDR</span>
              <span className="clock-value">{clock.ip4} /{clock.cidr.prefix}</span>
            </div>
            <div className="clock-row">
              <span className="clock-label">CLA 4bit</span>
              <span className="clock-value">A:{clock.A} B:{clock.B} - S:{clock.cla.S.join('')}</span>
            </div>
            <label className="slider-row">tick index
              <input
                type="range"
                min={0}
                max={5039}
                value={projectionState.tick}
                step={1}
                onChange={(event) => setClockTick(Number(event.target.value))}
              />
            </label>
            <div className="proto-group">
              {PROTOCOLS.map((protocol) => (
                <button
                  key={protocol}
                  type="button"
                  className={`proto-pill${protocols[protocol] ? ' active' : ''}`}
                  data-proto={protocol}
                  data-omi={composeOmiCarrier(protocol, protocol.length, 'router')}
                  data-imo={receiptCandidateImo()}
                  onClick={() => toggleProtocol(protocol)}
                >
                  {protocol.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="clock-card">
            <div className="clock-row">
              <span className="clock-label">motifs</span>
              <span className="clock-value small">{motifs.length ? motifs.join(' / ') : 'none'}</span>
            </div>
            <div className="clock-row">
              <span className="clock-label">receipt candidate</span>
              <span className="clock-value small">{projectionState.receiptCount} receipts · {projectionState.topologyNodeCount} topology nodes</span>
            </div>
            <div className="clock-row">
              <span className="clock-label">URN tick ingress</span>
              <span className="clock-value small">{tickUrn.urn.slice(0, 28)}</span>
            </div>
            <div className="clock-row">
              <span className="clock-label">URN tock egress</span>
              <span className="clock-value small">{tockUrn.urn.slice(0, 28)}</span>
            </div>
            <div className="clock-row">
              <span className="clock-label">chiral route</span>
              <span className="clock-value small">tick [{clock.ip6}] - tock [{clock.ip4}]</span>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-item"><span>sent</span><strong>{stats.sent}</strong></div>
            <div className="stat-item"><span>recv</span><strong>{stats.recv}</strong></div>
            <div className="stat-item"><span>errors</span><strong>{stats.err}</strong></div>
            <div className="stat-item"><span>latency</span><strong>{stats.lat ? `${stats.lat}ms` : '-'}</strong></div>
          </div>

          <div className="lane-grid">
            <div><span>FS 0x1C</span><code>blob://{clock.ip4.split('.')[0]}.bin</code></div>
            <div><span>GS 0x1D</span><code>group mem: {clock.cla.S.join('')}</code></div>
            <div><span>RS 0x1E</span><code>link {clock.cidr.mask}</code></div>
            <div><span>US 0x1F</span><code>base64 {safeBase64(clock.ip6).slice(0, 12)}..</code></div>
          </div>
          {motifs.length > 0 && (
            <div className="motif-jump-row" aria-label="Narrative motif selector">
              {motifs.map((motif) => (
                <button
                  key={motif}
                  type="button"
                  className="motif-chip"
                  data-omi={composeOmiCarrier(motif.toLowerCase(), motif.length, 'motif')}
                  data-imo={receiptCandidateImo()}
                  data-motif={motif}
                  onClick={() => playbackControls.scrubMotif(motif)}
                >
                  {motif}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
