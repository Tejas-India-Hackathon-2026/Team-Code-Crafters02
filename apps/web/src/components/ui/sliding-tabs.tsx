'use client';

import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import React from 'react';

export interface TabItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    badge?: string | number;
}

interface SlidingTabsProps {
    tabs: TabItem[];
    activeTab: string;
    onChange: (tabId: string) => void;
    className?: string;
    pillClassName?: string;
    tabClassName?: string;
}

export function SlidingTabs({
    tabs,
    activeTab,
    onChange,
    className,
    pillClassName,
    tabClassName,
}: SlidingTabsProps) {
    return (
        <div
            className={cn(
                'flex items-center gap-1.5 p-1.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl overflow-x-auto no-scrollbar shadow-xs',
                className
            )}
            role="tablist"
        >
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onChange(tab.id)}
                        className={cn(
                            'relative px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors duration-200 flex items-center gap-2 whitespace-nowrap z-10 cursor-pointer select-none',
                            isActive
                                ? 'text-white'
                                : 'text-[#6B635B] hover:text-[#1E1B18] hover:bg-black/[0.02]',
                            tabClassName
                        )}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="sliding-tabs-pill"
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                className={cn(
                                    'absolute inset-0 bg-[#C85A32] rounded-xl shadow-sm -z-10',
                                    pillClassName
                                )}
                            />
                        )}
                        {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                        <span>{tab.label}</span>
                        {tab.badge !== undefined && (
                            <span
                                className={cn(
                                    'text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold',
                                    isActive
                                        ? 'bg-white/20 text-white'
                                        : 'bg-[#E8E2D9] text-[#6B635B]'
                                )}
                            >
                                {tab.badge}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
