import React from 'react';
import { OmiSurface, type OmiSurfaceProps } from './OmiSurface';

export function OmiForm(props: OmiSurfaceProps) {
  return <OmiSurface {...props} surface="form" title={props.title ?? 'Omi-Form'} />;
}
