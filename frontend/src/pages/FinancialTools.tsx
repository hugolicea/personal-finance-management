import { useNavigate } from 'react-router-dom';

// Tool card definitions — hoisted to module level (rendering-hoist-jsx)
const TOOLS = [
    {
        path: '/tools/compound-interest',
        icon: '📈',
        title: 'Compound Interest',
        description:
            'Calculate how your investment grows over time with the power of compounding.',
        tags: ['Savings', 'Investments'],
        color: 'indigo',
    },
    {
        path: '/tools/loan-calculator',
        icon: '🏦',
        title: 'Loan Calculator',
        description:
            'Calculate mortgage payments with taxes & insurance, or auto loan payments with trade-in and amortization.',
        tags: ['Loans', 'Debt'],
        color: 'emerald',
    },
] as const;

type ToolColor = (typeof TOOLS)[number]['color'];

const COLOR_CLASSES: Record<
    ToolColor,
    { badge: string; icon: string; arrow: string }
> = {
    indigo: {
        badge: 'bg-indigo-100 text-indigo-700',
        icon: 'bg-indigo-50 text-4xl',
        arrow: 'text-indigo-500 group-hover:text-indigo-700',
    },
    emerald: {
        badge: 'bg-emerald-100 text-emerald-700',
        icon: 'bg-emerald-50 text-4xl',
        arrow: 'text-emerald-500 group-hover:text-emerald-700',
    },
};

function FinancialTools() {
    const navigate = useNavigate();

    return (
        <div className='space-y-6'>
            {/* Page header */}
            <div>
                <h1 className='text-2xl font-bold text-base-content'>
                    Financial Tools
                </h1>
                <p className='mt-1 text-sm opacity-60'>
                    Interactive calculators to help you plan your financial
                    future.
                </p>
            </div>

            {/* Tool cards grid */}
            <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
                {TOOLS.map((tool) => {
                    const colors = COLOR_CLASSES[tool.color];
                    return (
                        <button
                            key={tool.path}
                            onClick={() => navigate(tool.path)}
                            className='group relative card bg-base-100 shadow-sm border border-base-300 p-6 text-left hover:shadow-md hover:border-base-300 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500'
                        >
                            {/* Icon */}
                            <div
                                className={`inline-flex items-center justify-center w-14 h-14 rounded-lg ${colors.icon} mb-4`}
                            >
                                <span role='img' aria-hidden='true'>
                                    {tool.icon}
                                </span>
                            </div>

                            {/* Title + description */}
                            <h2 className='text-base font-semibold text-base-content mb-1'>
                                {tool.title}
                            </h2>
                            <p className='text-sm text-gray-500 mb-4 leading-relaxed'>
                                {tool.description}
                            </p>

                            {/* Tags */}
                            <div className='flex flex-wrap gap-1.5 mb-4'>
                                {tool.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors.badge}`}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            {/* CTA arrow */}
                            <span
                                className={`text-sm font-medium ${colors.arrow} transition-colors`}
                            >
                                Open calculator →
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default FinancialTools;
