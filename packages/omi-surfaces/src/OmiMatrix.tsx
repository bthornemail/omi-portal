import React from 'react';
import { OmiSurface, type OmiSurfaceProps } from './OmiSurface';

export function OmiMatrix(props: OmiSurfaceProps) {
  return <OmiSurface {...props} surface="matrix" title={props.title ?? 'Omi-Matrix'} />;
}
