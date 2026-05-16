import { useEffect } from 'react';

export default function assert(test: boolean, message?: string) {
  if (!test) {
    throw new Error(`Assertion Failure: ${message ?? 'No message provided.'}`);
  }
}

export function useAssertion(assertion: boolean, message: string, _dependencies: any[]) {
  useEffect(() => {
    assert(assertion, message);
  }, [assertion, message]);
}
