export type DesignId = 'fano' | 'sbibd' | 'latin' | 'hadamard' | 'diffset' | 'tuscan';

export type GaugeName = 'FS' | 'GS' | 'RS' | 'US';

export type ReceiptState = 'candidate' | 'accepted' | 'rejected';

export type OmiProjectionRef = {
  id: string;
  dataOmi: string;
  dataImo: string;
  gauge: GaugeName;
  sealedGauge: string;
  word16?: string;
  carBase36?: string;
  cdrBase64?: string;
  slot5040?: number;
  receiptState: ReceiptState;
};

export type SurfaceCommentDeclaration = {
  id: string;
  articleId: string;
  passageId?: string;
  subject: string;
  predicate: string;
  object: string;
  motif?: string;
  comment: string;
  projection: OmiProjectionRef;
};

export type NarrativeBeat = {
  beatId: string;
  documentId: string;
  phase: string;
  paragraphIndex: number;
  caption: string;
  durationTicks?: number;
  motifs?: string[];
  phaseEmoji?: string;
  phaseColor?: string;
};

export type NarrativeProjectionState = {
  ready: boolean;
  playing: boolean;
  beat: NarrativeBeat | null;
  beatIndex: number;
  beatCount: number;
  tick: number;
  epoch: number;
  gateState: string;
  receiptCount: number;
  topologyNodeCount: number;
  activeDesign: DesignId;
};

export type VisualLiterateCell = {
  id: string;
  title: string;
  grade: "dev" | "consumer" | "production" | "verify" | "pipeline";
  stage?: string;
  explanation: string;
  sourceRefs: {
    path: string;
    kind: "md" | "omi" | "imo" | "o" | "ts" | "js" | "c" | "test" | "make";
  }[];
  command?: string;
  projection: {
    dataOmi: string;
    dataImo: string;
    gauge?: GaugeName;
    receiptState: ReceiptState;
  };
  result?: {
    status: "idle" | "running" | "passed" | "failed";
    stdout?: string;
    stderr?: string;
    receipt?: string;
  };
};

export type InfrastructureProjection = {
  id: string;
  kind:
    | "make-target"
    | "docker-stage"
    | "compose-service"
    | "bake-target"
    | "nginx-block";
  sourceFile: string;
  name: string;
  description?: string;
  command?: string;
  dependencies: string[];
  dataOmi: string;
  dataImo: string;
  receiptState: ReceiptState;
};
