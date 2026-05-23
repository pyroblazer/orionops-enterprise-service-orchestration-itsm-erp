declare module 'jest-axe' {
  const axe: (el: HTMLElement, options?: Record<string, unknown>) => Promise<Record<string, unknown>>;
  const toHaveNoViolations: Record<string, unknown>;
  export { axe, toHaveNoViolations };
}
