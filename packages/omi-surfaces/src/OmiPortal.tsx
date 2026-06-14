import React from 'react';
import { OmiSurface, type OmiSurfaceProps } from './OmiSurface';

export function OmiPortal(props: OmiSurfaceProps) {
  return <OmiSurface {...props} surface="portal" title={props.title ?? 'Omi-Portal'} />;
}
