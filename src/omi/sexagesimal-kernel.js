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
}
