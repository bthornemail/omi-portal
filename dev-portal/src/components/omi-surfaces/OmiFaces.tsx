import React, { type PropsWithChildren } from 'react';
import type { OmiCarrier } from '../../omi/omiSurfaceCarrier';
import { OmiSurface } from './OmiSurface';

type FaceProps = PropsWithChildren<{ carrier: OmiCarrier; className?: string }>;

export function OmiForm({ carrier, className = '', children }: FaceProps) {
  return <OmiSurface carrier={carrier} surface="form" className={className} title="Omi-Form">{children}</OmiSurface>;
}

export function OmiGlyph({ carrier, className = '', children }: FaceProps) {
  return <OmiSurface carrier={carrier} surface="glyph" className={className} title="Omi-Glyph">{children}</OmiSurface>;
}

export function OmiMatrix({ carrier, className = '', children }: FaceProps) {
  return <OmiSurface carrier={carrier} surface="matrix" className={className} title="Omi-Matrix">{children}</OmiSurface>;
}

export function OmiGnomon({ carrier, className = '', children }: FaceProps) {
  return <OmiSurface carrier={carrier} surface="gnomon" className={className} title="Omi-Gnomon">{children}</OmiSurface>;
}

export function OmiPortal({ carrier, className = '', children }: FaceProps) {
  return <OmiSurface carrier={carrier} surface="portal" className={className} title="Omi-Portal">{children}</OmiSurface>;
}

export function OmiWorld({ carrier, className = '', children }: FaceProps) {
  return <OmiSurface carrier={carrier} surface="world" className={className} title="Omi-World">{children}</OmiSurface>;
}
