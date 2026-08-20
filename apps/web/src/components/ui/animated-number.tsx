'use client';

import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform, type SpringOptions } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface AnimatedNumberProps {
    value: number;
    className?: string;
    springOptions?: SpringOptions;
    as?: React.ElementType;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    format?: (value: number) => string;
}

export function AnimatedNumber({
    value,
    className,
    springOptions,
    as = 'span',
    prefix = '',
    suffix = '',
    decimals = 0,
    format,
}: AnimatedNumberProps) {
    const spring = useSpring(0, springOptions || { mass: 0.8, stiffness: 75, damping: 15 });
    
    const display = useTransform(spring, (current) => {
        if (format) {
            return format(current);
        }
        return `${prefix}${current.toFixed(decimals)}${suffix}`;
    });

    const [renderedValue, setRenderedValue] = useState<string>(() => {
        if (format) {
            return format(value);
        }
        return `${prefix}${value.toFixed(decimals)}${suffix}`;
    });

    useEffect(() => {
        spring.set(value);
    }, [spring, value]);

    useEffect(() => {
        return display.on('change', (latest) => {
            setRenderedValue(latest);
        });
    }, [display]);

    const Component = as as any;

    return (
        <Component className={cn('tabular-nums font-mono', className)}>
            {renderedValue}
        </Component>
    );
}

export default AnimatedNumber;
