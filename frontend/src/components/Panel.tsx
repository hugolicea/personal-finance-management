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
        <div className={`card bg-base-100 shadow-sm ${className}`}>
            <div className={`card-body ${headerClassName}`}>
                {(title || actions) && (
                    <div className='flex items-start justify-between mb-4'>
                        <div>
                            {title && (
                                <h3 className='card-title text-base'>
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
