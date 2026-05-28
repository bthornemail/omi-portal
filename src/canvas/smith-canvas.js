import { SMITH_MATRIX_SLOTS, activeSmithState, smithPointForSlot } from "../runtime/chiral-smith.js";

const RESISTANCE_LINES = [0.2, 0.5, 1, 2, 5];
const REACTANCE_LINES = [0.2, 0.5, 1, 2, 5, -0.2, -0.5, -1, -2, -5];

export class ChiralSmithCanvas {
  constructor(canvas, matrix, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.matrix = matrix;
    this.options = {
      background: "#0d1117",
      grid: "rgba(148, 163, 184, 0.22)",
      resistance: "rgba(96, 165, 250, 0.20)",
      inductive: "rgba(45, 212, 191, 0.20)",
      capacitive: "rgba(251, 146, 60, 0.18)",
      cloud: "rgba(148, 163, 184, 0.30)",
      tick: "#f97316",
      tock: "#22c55e",
      text: "#d1d5db",
      ...options
    };
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const cssWidth = Math.max(320, Math.floor(rect.width || this.canvas.clientWidth || 640));
    const cssHeight = Math.max(320, Math.floor(rect.height || this.canvas.clientHeight || 640));
    this.canvas.width = Math.floor(cssWidth * dpr);
    this.canvas.height = Math.floor(cssHeight * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = cssWidth;
    this.height = cssHeight;
    this.cx = cssWidth / 2;
    this.cy = cssHeight / 2;
    this.radius = Math.min(cssWidth, cssHeight) * 0.44;
  }

  project(gamma) {
    return {
      x: this.cx + gamma.re * this.radius,
      y: this.cy - gamma.im * this.radius
    };
  }

  drawGrid() {
    const { ctx } = this;
    ctx.fillStyle = this.options.background;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = this.options.grid;
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(this.cx - this.radius, this.cy);
    ctx.lineTo(this.cx + this.radius, this.cy);
    ctx.stroke();

    for (const r of RESISTANCE_LINES) {
      const rad = this.radius / (r + 1);
      const x = this.cx + (r / (r + 1)) * this.radius;
      ctx.beginPath();
      ctx.arc(x, this.cy, rad, 0, Math.PI * 2);
      ctx.strokeStyle = this.options.resistance;
      ctx.stroke();
    }

    for (const x of REACTANCE_LINES) {
      const rad = Math.abs(this.radius / x);
      const arcX = this.cx + this.radius;
      const arcY = this.cy - this.radius / x;
      ctx.beginPath();
      ctx.arc(arcX, arcY, rad, 0, Math.PI * 2);
      ctx.strokeStyle = x > 0 ? this.options.inductive : this.options.capacitive;
      ctx.stroke();
    }

    ctx.restore();
  }

  drawMatrixCloud() {
    const { ctx } = this;
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, this.radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = this.options.cloud;

    for (let slot = 0; slot < SMITH_MATRIX_SLOTS; slot++) {
      const point = smithPointForSlot(this.matrix, slot);
      const p = this.project(point.gamma);
      ctx.fillRect(p.x, p.y, 1.15, 1.15);
    }

    ctx.restore();
  }

  drawActivePair() {
    const { ctx } = this;
    const state = activeSmithState(this.matrix);
    const tickPoint = this.project(state.point.gamma);
    const tockPoint = this.project(state.point.gammaY);

    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "rgba(209, 213, 219, 0.35)";
    ctx.beginPath();
    ctx.moveTo(tickPoint.x, tickPoint.y);
    ctx.lineTo(tockPoint.x, tockPoint.y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = this.options.tick;
    ctx.beginPath();
    ctx.arc(tickPoint.x, tickPoint.y, 5.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.options.tock;
    ctx.beginPath();
    ctx.arc(tockPoint.x, tockPoint.y, 5.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.options.text;
    ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    ctx.fillText(`slot ${state.slot}/5040`, 18, 24);
    ctx.fillText(`ΓZ ${state.point.gamma.re.toFixed(3)} ${state.point.gamma.im >= 0 ? "+" : "-"} j${Math.abs(state.point.gamma.im).toFixed(3)}`, 18, 42);
    ctx.fillText(`z  ${state.point.z.re.toFixed(3)} ${state.point.z.im >= 0 ? "+" : "-"} j${Math.abs(state.point.z.im).toFixed(3)}`, 18, 60);
    ctx.restore();

    return state;
  }

  render() {
    this.drawGrid();
    this.drawMatrixCloud();
    return this.drawActivePair();
  }
}
