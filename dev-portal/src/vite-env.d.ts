/// <reference types="vite/client" />

declare namespace JSX {
  interface IntrinsicElements {
    'omi-gate': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { 'data-address'?: string };
  }
}
