import React from 'react';
import { OmiSurface, type OmiSurfaceProps } from './OmiSurface';

export function OmiGnomon(props: OmiSurfaceProps) {
  return <OmiSurface {...props} surface="gnomon" title={props.title ?? 'Omi-Gnomon'} />;
}
