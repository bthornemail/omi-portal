import React, { type PropsWithChildren, type ReactNode } from 'react';
import { omiCarrierDataAttributes, type OmiCarrier, type OmiSurfaceName } from '../../omi/omiSurfaceCarrier';

type OmiSurfaceProps = PropsWithChildren<{
  carrier: OmiCarrier;
  surface?: OmiSurfaceName;
  className?: string;
  title?: ReactNode;
}>;

export function OmiSurface({ carrier, surface = carrier.surface, className = '', title, children }: OmiSurfaceProps) {
  return (
    <section
      className={`omi-surface ${className}`.trim()}
      {...omiCarrierDataAttributes(carrier, surface)}
    >
      {title && <div className="omi-surface-title">{title}</div>}
      {children}
    </section>
  );
}
