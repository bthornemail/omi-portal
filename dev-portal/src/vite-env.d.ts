/// <reference types="vite/client" />

import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'omi-gate': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & { 'data-address'?: string };
    }
  }
}
