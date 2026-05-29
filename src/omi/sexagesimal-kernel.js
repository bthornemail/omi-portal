import { OmiOmicronCIDRKernel } from './omicron-kernel.js';

export class OmiSexagesimalKernel extends OmiOmicronCIDRKernel {
  constructor(sharedArrayBuffer) {
    super(sharedArrayBuffer);
    this.CONSTANT_C = 0x5A3C;
    this.CANONICAL_ROOT = "ffff-127-0-0-1";
  }

  parseSexagesimalAddress(idTokenString) {
    if (!idTokenString) return this.cons({ valid: false, error: "Empty Token" }, null);

    const slotMatch = idTokenString.match(/slot(\d+)/);
    const stepMatch = idTokenString.match(/step(\d+)/);

    const currentStrideValue = slotMatch ? parseInt(slotMatch[1], 10) : 0;
    const sexagesimalStepDigit = stepMatch ? parseInt(stepMatch[1], 10) : 0;

    const isSexagesimalDigitValid = sexagesimalStepDigit >= 0 && sexagesimalStepDigit <= 59;
    const isFactorialStrideValid =
      currentStrideValue === 120 ||
      currentStrideValue === 720 ||
      currentStrideValue === 5040;

    const isTokenValid = isSexagesimalDigitValid && isFactorialStrideValid;

    const slashParts = idTokenString.split('/');
    let base64DataPayload = null;
    if (slashParts.length > 1) {
      const afterSlash = slashParts.slice(1).join('/');
      const dashIdx = afterSlash.indexOf('-');
      if (dashIdx !== -1) {
        base64DataPayload = afterSlash.slice(dashIdx + 1);
      }
    }

    return this.cons(
      {
        valid: isTokenValid,
        astronomy: {
          currentStrideValue,
          sexagesimalStepDigit,
          fractionalRatio: sexagesimalStepDigit / 60.0
        },
        metadata: {
          slotToken: slotMatch ? slotMatch[0] : null,
          stepToken: stepMatch ? stepMatch[0] : null
        }
      },
      (isTokenValid && base64DataPayload && base64DataPayload.length > 10)
        ? this.decodePayloadBits(base64DataPayload)
        : null
    );
  }

  evaluateProjectiveSuffix(omiTokenString) {
    if (!omiTokenString) {
      return this.cons({ valid: false, error: "Empty Token" }, null);
    }

    const pieces = omiTokenString.split("/");
    if (pieces.length < 3) {
      return this.cons({ valid: false, error: "Missing Target Suffix" }, null);
    }

    const baseAddress = pieces[0];
    const cidrMask = Number.parseInt(pieces[1], 10);
    const tailMetric = pieces[2];

    if (!baseAddress.startsWith("omi-") || !Number.isInteger(cidrMask) || cidrMask < 0 || cidrMask > 128) {
      return this.cons({ valid: false, error: "Malformed CIDR Prefix" }, null);
    }

    const baseSegments = baseAddress.slice(4).split("-");
    if (baseSegments.length !== 8 || !baseSegments.every((segment) => /^[0-9a-f]{4}$/i.test(segment))) {
      return this.cons({ valid: false, error: "Malformed Base Address" }, null);
    }

    if (!tailMetric) {
      return this.cons({ valid: false, error: "Missing Target Suffix" }, null);
    }

    let targetSlotOffset = 0;
    let ratio = null;
    let isHardResetBoundary = false;

    if (tailMetric.includes("-")) {
      const ratioParts = tailMetric.split("-");
      if (ratioParts.length !== 2 || !ratioParts.every((part) => /^\d+$/.test(part))) {
        return this.cons({ valid: false, error: "Malformed Reciprocal Ratio" }, null);
      }

      const n = Number.parseInt(ratioParts[0], 10);
      const m = Number.parseInt(ratioParts[1], 10);
      if (n <= 0 || m <= 0) {
        return this.cons({ valid: false, error: "Ratio Terms Must Be Positive" }, null);
      }

      targetSlotOffset = (n * m * 120) % 5040;
      ratio = { n, m, reciprocalKey: [Math.min(n, m), Math.max(n, m)].join("-") };
    } else {
      if (!/^\d+$/.test(tailMetric)) {
        return this.cons({ valid: false, error: "Malformed Clock Step" }, null);
      }

      const clockStep = Number.parseInt(tailMetric, 10);
      targetSlotOffset = clockStep % 5040;
      isHardResetBoundary = clockStep === 5040;
    }

    return this.cons(
      {
        valid: true,
        baseAddress,
        cidrMask,
        tailMetric,
        targetSlotOffset,
        isHardResetBoundary,
        ratio
      },
      omiTokenString
    );
  }
}
