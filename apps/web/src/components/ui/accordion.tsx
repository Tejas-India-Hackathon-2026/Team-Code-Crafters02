'use client';

import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AccordionContextType {
    value: string | string[];
    onToggle: (id: string) => void;
    allowMultiple: boolean;
}

const AccordionContext = createContext<AccordionContextType | null>(null);

const DEFAULT_TRANSITION: Transition = {
    type: 'spring',
    stiffness: 350,
    damping: 30,
};

export interface AccordionProps {
    children: React.ReactNode;
    multiple?: boolean;
    defaultValue?: string | string[];
    className?: string;
    transition?: Transition;
}

export function Accordion({
    children,
    multiple = false,
    defaultValue,
    className,
    transition = DEFAULT_TRANSITION,
}: AccordionProps) {
    const [value, setValue] = useState<string | string[]>(() => {
        if (defaultValue) return defaultValue;
        return multiple ? [] : '';
    });

    const onToggle = (id: string) => {
        if (multiple) {
            setValue((prev) => {
                const list = Array.isArray(prev) ? prev : [];
                return list.includes(id) ? list.filter((i) => i !== id) : [...list, id];
            });
        } else {
            setValue((prev) => (prev === id ? '' : id));
        }
    };

    return (
        <AccordionContext.Provider value={{ value, onToggle, allowMultiple: multiple }}>
            <div className={cn('flex flex-col gap-2.5 w-full', className)}>
                {children}
            </div>
        </AccordionContext.Provider>
    );
}

interface AccordionItemContextType {
    id: string;
    isOpen: boolean;
}

const AccordionItemContext = createContext<AccordionItemContextType | null>(null);

export interface AccordionItemProps {
    value: string;
    children: React.ReactNode;
    className?: string;
}

export function AccordionItem({ value: id, children, className }: AccordionItemProps) {
    const ctx = useContext(AccordionContext);
    if (!ctx) throw new Error('AccordionItem must be used within Accordion');

    const isOpen = Array.isArray(ctx.value) ? ctx.value.includes(id) : ctx.value === id;

    return (
        <AccordionItemContext.Provider value={{ id, isOpen }}>
            <div
                className={cn(
                    'border border-[#E8E2D9] rounded-2xl bg-white overflow-hidden shadow-xs transition-colors',
                    isOpen && 'border-[#C85A32]/40 bg-[#FAF7F2]/30',
                    className
                )}
            >
                {children}
            </div>
        </AccordionItemContext.Provider>
    );
}

export interface AccordionTriggerProps {
    children: React.ReactNode;
    className?: string;
}

export function AccordionTrigger({ children, className }: AccordionTriggerProps) {
    const itemCtx = useContext(AccordionItemContext);
    const accCtx = useContext(AccordionContext);
    if (!itemCtx || !accCtx) throw new Error('AccordionTrigger must be inside AccordionItem');

    return (
        <button
            type="button"
            onClick={() => accCtx.onToggle(itemCtx.id)}
            aria-expanded={itemCtx.isOpen}
            className={cn(
                'w-full p-4 flex items-center justify-between gap-3 text-left cursor-pointer select-none hover:bg-black/[0.01] transition-colors',
                className
            )}
        >
            <div className="flex-1 min-w-0">{children}</div>
            <motion.div
                animate={{ rotate: itemCtx.isOpen ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="shrink-0 text-[#6B635B]"
            >
                <ChevronDown className="w-4 h-4" />
            </motion.div>
        </button>
    );
}

export interface AccordionContentProps {
    children: React.ReactNode;
    className?: string;
}

export function AccordionContent({ children, className }: AccordionContentProps) {
    const itemCtx = useContext(AccordionItemContext);
    if (!itemCtx) throw new Error('AccordionContent must be inside AccordionItem');

    return (
        <AnimatePresence initial={false}>
            {itemCtx.isOpen && (
                <motion.div
                    key="accordion-content"
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
                    <div className={cn('px-4 pb-4 pt-1 border-t border-[#E8E2D9]/60 text-xs sm:text-sm text-[#1E1B18] leading-relaxed', className)}>
                        {children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default Accordion;
