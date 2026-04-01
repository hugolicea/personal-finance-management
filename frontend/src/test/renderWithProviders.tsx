/* eslint-disable react-refresh/only-export-components */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import { store } from '../store';

function createTestQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                staleTime: 0,
            },
            mutations: {
                retry: false,
            },
        },
    });
}

interface WrapperProps {
    children: React.ReactNode;
}

function AllProviders({ children }: WrapperProps) {
    const testQueryClient = createTestQueryClient();
    return (
        <Provider store={store}>
            <QueryClientProvider client={testQueryClient}>
                <MemoryRouter>{children}</MemoryRouter>
            </QueryClientProvider>
        </Provider>
    );
}

export function renderWithProviders(
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
) {
    return render(ui, { wrapper: AllProviders, ...options });
}
