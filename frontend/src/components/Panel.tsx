import React from 'react';

type PanelProps = {
    title?: React.ReactNode;
    actions?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
    headerClassName?: string;
};

export default function Panel({
    title,
    actions,
    children,
    className = '',
    headerClassName = '',
}: PanelProps) {
    return (
        <div
            className={`bg-white overflow-hidden shadow rounded-lg ${className}`}
        >
            <div className={`p-6 ${headerClassName}`}>
                {(title || actions) && (
                    <div className='flex items-start justify-between mb-4'>
                        <div>
                            {title && (
                                <h3 className='text-lg leading-6 font-medium text-gray-900'>
                                    {title}
                                </h3>
                            )}
                        </div>
                        <div>{actions}</div>
                    </div>
                )}

                <div>{children}</div>
            </div>
        </div>
    );
}
