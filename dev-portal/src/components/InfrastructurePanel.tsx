import { useMemo, useState } from 'react';
import { composeOmiCarrier, receiptCandidateImo } from '../omi/omiCarrier';
import {
  PIPELINE_LABELS,
  type MakeTarget
} from '../omi/makefileParser';
import type { DockerfileStage } from '../omi/dockerfileParser';
import type { ComposeService } from '../omi/composeParser';
import type { BakeTarget } from '../omi/bakeParser';
import type { NginxBlock } from '../omi/nginxParser';
import type { VisualLiterateCell } from '../narrative/narrativeTypes';

type InfrastructurePanelProps = {
  makeTargets: MakeTarget[];
  dockerStages: DockerfileStage[];
  composeServices: ComposeService[];
  bakeTargets: BakeTarget[];
  nginxBlocks: NginxBlock[];
  networkingCells?: VisualLiterateCell[];
};

const GROUP_COLORS: Record<string, string> = {
  grade: '#44d9a2',
  verification: '#5b8dee',
  pipeline: '#f59e0b',
  development: '#8b5cf6',
  production: '#ef4444',
  infrastructure: '#14b8a6',
  release: '#ec4899',
  other: '#6b7280'
};

export function InfrastructurePanel({
  makeTargets,
  dockerStages,
  composeServices,
  bakeTargets,
  nginxBlocks,
  networkingCells = []
}: InfrastructurePanelProps) {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'grades' | 'docker' | 'compose' | 'bake' | 'nginx' | 'network'>('pipeline');

  const gradeTargets = useMemo(
    () => makeTargets.filter((t) => t.group === 'grade'),
    [makeTargets]
  );
  const verifyTargets = useMemo(
    () => makeTargets.filter((t) => t.group === 'verification'),
    [makeTargets]
  );

  return (
    <section
      className="panel infrastructure-panel"
      data-omi={composeOmiCarrier('infrastructure-panel', makeTargets.length + dockerStages.length, 'workbench')}
      data-imo={receiptCandidateImo()}
    >
      <div className="panel-heading-row">
        <div>
          <p className="eyebrow">Visual Literate Workbench</p>
          <h2>Infrastructure Projection</h2>
        </div>
        <span className="design-status">
          {makeTargets.length} targets · {dockerStages.length} stages · {composeServices.length} services · {bakeTargets.length} bake · {networkingCells.length} net
        </span>
      </div>
      <p className="boundary-copy">
        The Makefile routes grades. The binary runtime proves portability. The .omi files declare. The .imo files mirror. The React components project. The receipts accept.
      </p>

      <div className="infra-tabs">
        {(['pipeline', 'grades', 'docker', 'compose', 'bake', 'nginx', 'network'] as const).map((tab) => (
          <button
            key={tab}
            className={`infra-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'pipeline' && '13-Step Pipeline'}
            {tab === 'grades' && 'Grades'}
            {tab === 'docker' && 'Dockerfiles'}
            {tab === 'compose' && 'Compose'}
            {tab === 'bake' && 'Bake'}
            {tab === 'nginx' && 'Nginx'}
            {tab === 'network' && 'Network'}
          </button>
        ))}
      </div>

      {activeTab === 'pipeline' && (
        <div className="pipeline-rail">
          {PIPELINE_LABELS.map((step, i) => (
            <div key={step.step} className="pipeline-stage" data-step={step.step}>
              <div className="pipeline-number">{step.number}</div>
              <div className="pipeline-content">
                <strong>{step.step.toUpperCase()}</strong>
                <span>{step.description}</span>
                {step.step === 'source' && (
                  <code className="pipeline-command">make source</code>
                )}
              </div>
              {i < PIPELINE_LABELS.length - 1 && <div className="pipeline-arrow">→</div>}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'grades' && (
        <div className="infra-section">
          <h3 className="infra-section-title">
            Grades
            <span className="infra-badge">{gradeTargets.length}</span>
          </h3>
          <div className="infra-grid">
            {gradeTargets.map((t) => (
              <InfraCard key={t.name} item={t} groupColors={GROUP_COLORS} />
            ))}
          </div>

          <h3 className="infra-section-title" style={{ marginTop: 20 }}>
            Verification Gates
            <span className="infra-badge">{verifyTargets.length}</span>
          </h3>
          <div className="infra-tight-grid">
            {verifyTargets.map((t) => (
              <InfraCard key={t.name} item={t} groupColors={GROUP_COLORS} compact />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'docker' && (
        <div className="infra-section">
          <h3 className="infra-section-title">
            Dockerfile Stages
            <span className="infra-badge">{dockerStages.length}</span>
          </h3>
          <div className="infra-stage-flow">
            {dockerStages.map((s, i) => (
              <div key={`${s.file}:${s.name}`} className="docker-stage-card" data-file={s.file}>
                <div className="docker-stage-header">
                  <span className="docker-stage-file">{s.file}</span>
                  <span className="docker-stage-name">{s.name}</span>
                </div>
                <code className="docker-stage-from">FROM {s.from}</code>
                {s.description && <p className="docker-stage-desc">{s.description}</p>}
                <span className="docker-stage-lines">{s.lines} lines</span>
                {i < dockerStages.length - 1 && <div className="pipeline-arrow stage-flow-arrow">↓</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'compose' && (
        <div className="infra-section">
          <h3 className="infra-section-title">
            Compose Services
            <span className="infra-badge">{composeServices.length}</span>
          </h3>
          <div className="infra-grid">
            {composeServices.map((s) => (
              <div key={`${s.file}:${s.name}`} className="compose-card" data-file={s.file}>
                <div className="compose-header">
                  <strong>{s.name}</strong>
                  <span className="compose-file">{s.file}</span>
                </div>
                <div className="compose-detail">
                  <span>dockerfile: {s.dockerfile}</span>
                  {s.target && <span>target: {s.target}</span>}
                  {s.containerName && <span>container: {s.containerName}</span>}
                </div>
                {s.profiles.length > 0 && (
                  <div className="compose-profiles">
                    {s.profiles.map((p) => (
                      <span key={p} className="compose-profile-tag">{p}</span>
                    ))}
                  </div>
                )}
                {s.ports.length > 0 && (
                  <code className="compose-ports">{s.ports.join(', ')}</code>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'bake' && (
        <div className="infra-section">
          <h3 className="infra-section-title">
            Bake Targets
            <span className="infra-badge">{bakeTargets.length}</span>
          </h3>
          <div className="infra-grid">
            {bakeTargets.map((t) => (
              <div key={`${t.file}:${t.name}`} className="bake-card" data-group={t.group}>
                <div className="bake-header">
                  <strong>{t.name}</strong>
                  {t.group && <span className="bake-group">{t.group}</span>}
                </div>
                <div className="bake-detail">
                  <span>dockerfile: {t.dockerfile}</span>
                  {t.target && <span>target stage: {t.target}</span>}
                </div>
                <div className="bake-platforms">
                  {t.platforms.map((p) => (
                    <span key={p} className="bake-platform-tag">{p}</span>
                  ))}
                </div>
                {t.tags.length > 0 && (
                  <code className="bake-tags">{t.tags[0]}</code>
                )}
                {t.inherits.length > 0 && (
                  <div className="bake-inherits">
                    inherits: {t.inherits.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'nginx' && (
        <div className="infra-section">
          <h3 className="infra-section-title">
            Nginx Configuration Blocks
            <span className="infra-badge">{nginxBlocks.length}</span>
          </h3>
          <div className="infra-tight-grid">
            {nginxBlocks.map((block, i) => (
              <div
                key={`nginx:${i}:${block.kind}`}
                className="nginx-card"
                data-kind={block.kind}
              >
                <div className="nginx-header">
                  <span className="nginx-kind">{block.kind}</span>
                  {block.name && <span className="nginx-name">{block.name}</span>}
                </div>
                <div className="nginx-directives">
                  {block.directives.slice(0, 5).map((d) => (
                    <code key={d.key} className="nginx-directive">
                      {d.key} {d.value}
                    </code>
                  ))}
                  {block.directives.length > 5 && (
                    <span className="nginx-more">+{block.directives.length - 5} more</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'network' && (
        <div className="infra-section">
          <h3 className="infra-section-title">
            OMI Network Protocol Stack
            <span className="infra-badge">{networkingCells.length} sections</span>
          </h3>
          <div className="network-doc-list">
            {networkingCells.map((cell) => (
              <div
                key={cell.id}
                className="network-cell"
                data-omi={cell.projection.dataOmi}
                data-imo={cell.projection.dataImo}
                data-grade={cell.grade}
              >
                <div className="network-cell-header">
                  <span className={`network-grade-tag grade-${cell.grade}`}>{cell.grade}</span>
                  <strong className="network-cell-title">{cell.title}</strong>
                </div>
                <p className="network-cell-explain">{cell.explanation}</p>
                <div className="network-cell-meta">
                  {cell.sourceRefs.map((ref, i) => (
                    <code key={i} className="network-src-ref">{ref.path}</code>
                  ))}
                  {cell.command && (
                    <code className="network-command">make {cell.command}</code>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function InfraCard({ item, groupColors, compact }: {
  item: { name: string; description?: string; group: string; dependencies: string[]; command?: string };
  groupColors: Record<string, string>;
  compact?: boolean;
}) {
  const color = groupColors[item.group] || '#6b7280';
  return (
    <div
      className={`infra-card ${compact ? 'infra-card-compact' : ''}`}
      style={{ borderLeftColor: color }}
      data-group={item.group}
    >
      <div className="infra-card-header">
        <strong>{item.name}</strong>
        <span className="infra-card-group" style={{ color }}>
          {item.group}
        </span>
      </div>
      {item.description && (
        <p className="infra-card-desc">{item.description}</p>
      )}
      {item.command && (
        <code className="infra-card-command">{item.command}</code>
      )}
      {item.dependencies.length > 0 && !compact && (
        <div className="infra-card-deps">
          {item.dependencies.map((dep) => (
            <span key={dep} className="infra-dep-tag">{dep}</span>
          ))}
        </div>
      )}
    </div>
  );
}
