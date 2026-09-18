import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { MemoryRouterProps } from 'react-router-dom';
import type { ReactElement, ReactNode } from 'react';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  initialEntries?: MemoryRouterProps['initialEntries'];
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    route = '/',
    initialEntries,
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: CustomRenderOptions = {},
) {
  const entries = initialEntries ?? [route];

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={entries}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
