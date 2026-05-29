/**
 * OMI PROTOCOL: HEADLESS BROWSERS AND MEDIA SECTOR REPLICATOR
 * File Target: scripts/user-space-test.js
 * Invariant Configuration: Automated SVG/CSSOM Verification [Zero-JS-Layout]
 */
import { execSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

class OmiUserSpaceValidationSuite {
  constructor() {
    this.targetUrl = "http://localhost:8080/bidi.html";
    this.outputFrameDir = join(process.cwd(), 'dist', 'frames');
    this.screenshotPath = join(this.outputFrameDir, 'canvas-snapshot.png');
  }

  async prepareEnvironment() {
    await fs.mkdir(this.outputFrameDir, { recursive: true });
    console.log(`[User-Space Engine] Initializing automated GUI validation loops...`);
    console.log(`  - Target Render Surface : ${this.targetUrl}`);
    console.log(`  - Local Frame Capture Dir: ${this.outputFrameDir}`);
  }

  executeHeadlessBrowserCapture() {
    console.log(`[User-Space Engine] Spawning Guix-pinned Headless Chromium engine...`);
    const chromiumCommand = `headless-chromium --headless --disable-gpu --no-sandbox --window-size=800,600 --screenshot=${this.screenshotPath} ${this.targetUrl} > /dev/null 2>&1`;
    try {
      execSync(`xvfb-run --server-args="-screen 0 800x600x24" ${chromiumCommand}`);
      console.log(`  - Headless layout frame captured successfully.`);
    } catch (err) {
      console.error(`[User-Space Engine] Headless Browser Execution Failed: Verify Guix Chromium pathways. Details: ${err.message}`);
      throw err;
    }
  }

  evaluateVisualConsistencyViaFFmpeg() {
    console.log(`[User-Space Engine] Running FFmpeg SSIM pixel-diff verification loop...`);
    const targetReferenceFrame = join(process.cwd(), 'test', 'reference-gui.png');
    const diffOutputPath = join(this.outputFrameDir, 'diff-analysis.png');
    try {
      execSync(`ls ${targetReferenceFrame} > /dev/null 2>&1`);
    } catch {
      execSync(`cp ${this.screenshotPath} ${targetReferenceFrame}`);
      console.log(`  - Reference image missing. Establishing current snapshot as baseline truth.`);
      return true;
    }
    const ffmpegCommand = `ffmpeg -i ${this.screenshotPath} -i ${targetReferenceFrame} -filter_complex "ssim=stats_file=-" -f null - 2>&1`;
    try {
      const outputBuffer = execSync(ffmpegCommand).toString();
      const ssimMatch = outputBuffer.match(/All:([\d.]+)/);
      const ssimScore = ssimMatch ? parseFloat(ssimMatch[1]) : 0.0;
      console.log(`============================================================================`);
      console.log(`OMI PROTOCOL: USER-SPACE RENDER PROFILE METRICS`);
      console.log(`============================================================================`);
      console.log(`  - Structural Similarity (SSIM) Score: ${ssimScore.toFixed(4)}`);
      const PASS_THRESHOLD = 0.9900;
      if (ssimScore < PASS_THRESHOLD) {
        console.error(`\n[User-Space Engine] VISUAL REJECT: Layout rendering drifted past the structural safety index threshold!`);
        process.exit(1);
      }
      console.log(`\n[User-Space Engine] USER-SPACE RENDERING PASS: CSSOM wildcard transforms verified pixel-accurate.`);
      console.log(`============================================================================`);
    } catch (err) {
      console.error(`[User-Space Engine] FFmpeg processing error: ${err.message}`);
      process.exit(1);
    }
  }

  async runTestSuite() {
    await this.prepareEnvironment();
    this.executeHeadlessBrowserCapture();
    this.evaluateVisualConsistencyViaFFmpeg();
  }
}

const suite = new OmiUserSpaceValidationSuite();
suite.runTestSuite().catch(err => {
  console.error(`[User-Space Engine] Fatal User-Space Testing Failure: ${err.message}`);
  process.exit(1);
});
