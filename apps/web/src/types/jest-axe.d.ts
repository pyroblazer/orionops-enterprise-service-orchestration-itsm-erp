declare module 'jest-axe' {
  interface AxeResults {
    violations: Array<{
      id: string;
      impact: string;
      nodes: Array<{
        target: string[];
        html: string;
        failureSummary: string;
      }>;
      help: string;
      helpUrl: string;
    }>;
    [key: string]: unknown;
  }

  const axe: (el: HTMLElement, options?: Record<string, unknown>) => Promise<AxeResults>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toHaveNoViolations: any;
  export { axe, toHaveNoViolations };
}

declare namespace jest {
  interface Matchers<R> {
    toHaveNoViolations(): R;
  }
}
