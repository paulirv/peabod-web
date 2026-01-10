import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Create a wrapper component that can include providers
interface TestProvidersProps {
  children: ReactNode;
}

function TestProviders({ children }: TestProvidersProps) {
  return <>{children}</>;
}

// Custom render function that wraps components with providers
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: TestProviders, ...options });
}

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
