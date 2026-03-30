import { useEffect, useMemo } from 'react';

import { useAppSelector } from './redux';

export const getFormDraftKey = (
    formName: string,
    userId?: number | string | null
): string => {
    return `${formName}-draft-${userId ?? 'guest'}`;
};

export const readFormDraft = <T>(
    formName: string,
    userId?: number | string | null
): Partial<T> | null => {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const value = localStorage.getItem(getFormDraftKey(formName, userId));
        if (!value) {
            return null;
        }

        const parsed = JSON.parse(value);
        return typeof parsed === 'object' && parsed !== null
            ? (parsed as Partial<T>)
            : null;
    } catch {
        return null;
    }
};

export const clearFormDraft = (
    formName: string,
    userId?: number | string | null
): void => {
    if (typeof window === 'undefined') {
        return;
    }

    localStorage.removeItem(getFormDraftKey(formName, userId));
};

function useFormDirty<T>(
    initialValues: T,
    currentValues: T,
    formName: string
): boolean {
    const userId = useAppSelector((state) => state.auth.user?.id ?? null);

    const storageKey = useMemo(
        () => getFormDraftKey(formName, userId),
        [formName, userId]
    );

    const initialSerialized = useMemo(
        () => JSON.stringify(initialValues),
        [initialValues]
    );
    const currentSerialized = useMemo(
        () => JSON.stringify(currentValues),
        [currentValues]
    );

    const isDirty = initialSerialized !== currentSerialized;

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        if (!isDirty) {
            localStorage.removeItem(storageKey);
            return;
        }

        const timeoutId = window.setTimeout(() => {
            localStorage.setItem(storageKey, currentSerialized);
        }, 2000);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [isDirty, storageKey, currentSerialized]);

    return isDirty;
}

export default useFormDirty;
