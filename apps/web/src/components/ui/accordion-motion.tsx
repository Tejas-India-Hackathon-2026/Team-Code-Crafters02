'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AccordionMotionItem {
    id: string;
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    badge?: React.ReactNode;
    icon?: React.ReactNode;
    content: React.ReactNode;
    defaultOpen?: boolean;
}

interface AccordionMotionProps {
    items: AccordionMotionItem[];
    allowMultiple?: boolean;
    className?: string;
    itemClassName?: string;
}

export function AccordionMotion({
    items,
    allowMultiple = false,
    className,
    itemClassName,
}: AccordionMotionProps) {
    const [openIds, setOpenIds] = useState<string[]>(() => {
        return items.filter((item) => item.defaultOpen).map((item) => item.id);
    });

    const toggleItem = (id: string) => {
        if (allowMultiple) {
            setOpenIds((prev) =>
                prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
            );
        } else {
            setOpenIds((prev) => (prev.includes(id) ? [] : [id]));
        }
    };

    return (
        <div className={cn('flex flex-col gap-2.5 w-full', className)}>
            {items.map((item) => {
                const isOpen = openIds.includes(item.id);
                return (
                    <div
                        key={item.id}
                        className={cn(
                            'border border-[#E8E2D9] rounded-2xl bg-white overflow-hidden shadow-xs transition-colors',
                            isOpen && 'border-[#C85A32]/40 bg-[#FAF7F2]/30',
                            itemClassName
                        )}
                    >
                        <button
                            type="button"
                            onClick={() => toggleItem(item.id)}
                            aria-expanded={isOpen}
                            className="w-full p-4 flex items-center justify-between gap-3 text-left cursor-pointer select-none hover:bg-black/[0.01] transition-colors"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                {item.icon && <span className="shrink-0 text-[#C85A32]">{item.icon}</span>}
                                <div className="min-w-0">
                                    <div className="font-semibold text-xs sm:text-sm text-[#1E1B18] flex items-center gap-2">
                                        <span>{item.title}</span>
                                        {item.badge}
                                    </div>
                                    {item.subtitle && (
                                        <p className="text-[11px] text-[#6B635B] mt-0.5 truncate">{item.subtitle}</p>
                                    )}
                                </div>
                            </div>
                            <motion.div
                                animate={{ rotate: isOpen ? 180 : 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                className="shrink-0 text-[#6B635B]"
                            >
                                <ChevronDown className="w-4 h-4" />
                            </motion.div>
                        </button>

                        <AnimatePresence initial={false}>
                            {isOpen && (
                                <motion.div
                                    key="content"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{
                                        height: 'auto',
                                        opacity: 1,
                                        transition: {
                                            height: { type: 'spring', stiffness: 400, damping: 30 },
                                            opacity: { duration: 0.2 },
                                        },
                                    }}
                                    exit={{
                                        height: 0,
                                        opacity: 0,
                                        transition: {
                                            height: { duration: 0.2 },
                                            opacity: { duration: 0.15 },
                                        },
                                    }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-4 pb-4 pt-1 border-t border-[#E8E2D9]/60 text-xs sm:text-sm text-[#1E1B18] leading-relaxed">
                                        {item.content}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
}
