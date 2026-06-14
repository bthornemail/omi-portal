import React from 'react';
import { OmiSurface, type OmiSurfaceProps } from './OmiSurface';

export function OmiWorld(props: OmiSurfaceProps) {
  return <OmiSurface {...props} surface="world" title={props.title ?? 'Omi-World'} />;
}
