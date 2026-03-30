import type { ReactElement } from 'react';

export default function SkipLinks(): ReactElement {
    return (
        <a
            href='#main-content'
            className='sr-only focus:not-sr-only fixed top-2 left-2 z-[60] rounded-md bg-primary px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary'
        >
            Skip to main content
        </a>
    );
}
