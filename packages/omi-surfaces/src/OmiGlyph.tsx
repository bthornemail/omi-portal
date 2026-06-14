import React from 'react';
import { OmiSurface, type OmiSurfaceProps } from './OmiSurface';

export function OmiGlyph(props: OmiSurfaceProps) {
  return <OmiSurface {...props} surface="glyph" title={props.title ?? 'Omi-Glyph'} />;
}
