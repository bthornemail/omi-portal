import React, { type PropsWithChildren, type ReactNode } from 'react';
import {
  createOmiCarrier,
  omiCarrierDataAttributes,
  type OmiCarrier,
  type OmiCarrierMime,
  type OmiSurfaceName,
  type ReceiptState,
} from './carrier';

export type OmiSurfaceProps = PropsWithChildren<{
  carrier?: OmiCarrier;
  surface?: OmiSurfaceName;
  className?: string;
  title?: ReactNode;
  id?: string;
  address?: string;
  imo?: string;
  receiptState?: ReceiptState;
  mime?: OmiCarrierMime;
  base64?: string;
  hash?: string;
  oWord?: string;
}>;

function resolveCarrier(props: OmiSurfaceProps): OmiCarrier {
  if (props.carrier) {
    return props.surface
      ? { ...props.carrier, surface: props.surface }
      : props.carrier;
  }

  return createOmiCarrier({
    id: props.id || `omi-${props.surface || 'surface'}`,
    address: props.address || 'o---o/---/?v=projection;l=10;h=carrier@3C@',
    surface: props.surface || 'form',
    receiptState: props.receiptState,
    mime: props.mime,
    base64: props.base64 || '',
    hash: props.hash,
    oWord: props.oWord,
  });
}

export function OmiSurface(props: OmiSurfaceProps) {
  const { className = '', title, children, surface, imo } = props;
  const carrier = resolveCarrier(props);
  const renderedSurface = surface || carrier.surface;

  return (
    <section
      className={`omi-surface ${className}`.trim()}
      {...omiCarrierDataAttributes(carrier, renderedSurface, imo)}
    >
      {title && <div className="omi-surface-title">{title}</div>}
      {children}
    </section>
  );
}
