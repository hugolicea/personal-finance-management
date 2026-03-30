import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export const useFocusTrap = (isActive: boolean) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!isActive) {
            return;
        }

        previousFocusRef.current = document.activeElement as HTMLElement | null;

        const getFocusableElements = (): HTMLElement[] => {
            if (!containerRef.current) {
                return [];
            }

            return Array.from(
                containerRef.current.querySelectorAll(FOCUSABLE_SELECTOR)
            ) as HTMLElement[];
        };

        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
            focusableElements[0]!.focus();
        } else {
            containerRef.current?.focus();
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Tab') {
                return;
            }

            const elements = getFocusableElements();
            if (elements.length === 0) {
                event.preventDefault();
                return;
            }

            const firstElement = elements[0]!;
            const lastElement = elements[elements.length - 1]!;

            if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
                return;
            }

            if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);

            if (
                previousFocusRef.current &&
                previousFocusRef.current.isConnected
            ) {
                previousFocusRef.current.focus();
            }
        };
    }, [isActive]);

    return containerRef;
};
