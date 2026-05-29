export class OmiSexagesimalSlideRuleKernel {
  constructor(sharedMemoryBuffer) {
    if (!sharedMemoryBuffer) throw new Error("[Omi SlideRule] SAB workspace allocation missing.");
    this.sab = sharedMemoryBuffer;
    this.floatArray = new Float64Array(this.sab);
    this.bigIntArray = new BigInt64Array(this.sab);
  }

  cons(car, cdr) { return Object.freeze({ car, cdr }); }
  car(cell) { return cell ? cell.car : null; }
  cdr(cell) { return cell ? cell.cdr : null; }

  _float64ToBigInt64(value) {
    const dv = new DataView(new ArrayBuffer(8));
    dv.setFloat64(0, value, true);
    return dv.getBigInt64(0, true);
  }

  _bigInt64ToFloat64(bits) {
    const dv = new DataView(new ArrayBuffer(8));
    dv.setBigInt64(0, bits, true);
    return dv.getFloat64(0, true);
  }

  evaluateCircularSlideRule(omiAddressString) {
    if (!omiAddressString || !omiAddressString.startsWith('omi-')) {
      return this.cons({ accepted: false }, null);
    }

    const segments = omiAddressString.split('/');
    const hexBlocks = segments[0].substring(4).split('-');

    if (hexBlocks.length < 8) return this.cons({ accepted: false }, null);

    const track1 = parseInt(hexBlocks[1], 16) || 0;
    const track2 = parseInt(hexBlocks[3], 16) || 0;
    const track3 = parseInt(hexBlocks[4], 16) || 0;
    const track4 = parseInt(hexBlocks[5], 16) || 0;
    const track5 = parseInt(hexBlocks[6], 16) || 0;

    let activeTrackCount = 0;
    if (track1 > 0) activeTrackCount++;
    if (track2 > 0) activeTrackCount++;
    if (track3 > 0) activeTrackCount++;
    if (track4 > 0) activeTrackCount++;
    if (track5 > 0) activeTrackCount++;

    const isIPv4MappedPair = (track4 === 0xFFFF);
    const isValidTwoOfFive = (activeTrackCount === 2 || track5 === 0x0003 || isIPv4MappedPair);

    const computedSlideAngle = (track3 * (track4 || 1)) % 5040;

    const targetMemorySlot = track4 % 5040;
    if (isValidTwoOfFive) {
      const asBigInt = this._float64ToBigInt64(computedSlideAngle || 1.0);
      Atomics.store(this.bigIntArray, targetMemorySlot, asBigInt);
    }

    const projective = this.evaluateProjectiveNetworks(hexBlocks.map(s => parseInt(s, 16) || 0));

    const metadataHeader = {
      accepted: isValidTwoOfFive,
      track1, track2, track3, track4, track5,
      activeTrackCount,
      isIPv4MappedPair,
      computedSlideAngle,
      targetMemorySlot,
      isTerminalFractalDepth: (track5 === 0x0007),
      projective
    };

    return this.cons(metadataHeader, omiAddressString);
  }

  evaluateProjectiveNetworks(segmentsArray) {
    if (!segmentsArray || segmentsArray.length < 8) return null;

    const seg0 = segmentsArray[0];
    const seg5 = segmentsArray[5];
    const seg6 = segmentsArray[6];
    const seg7 = segmentsArray[7];

    const isUlaCompliant = ((seg0 & 0xFE00) === 0xFC00);

    const isIPv4Mapped = (seg5 === 0xFFFF);

    const isDefaultLanFrame = (seg6 === 0xC0A8 && (seg7 & 0xFF00) === 0x0100);

    const isLocalhostPivot = (seg5 === 0xFFFF && seg6 === 0x7F00 && seg7 === 0x0001) || (seg7 === 0x0008);

    return {
      isUlaCompliant,
      isIPv4Mapped,
      isDefaultLanFrame,
      isLocalhostPivot,
      hasFullProjectiveDefinition: (isUlaCompliant || isIPv4Mapped || isDefaultLanFrame || isLocalhostPivot)
    };
  }
}
