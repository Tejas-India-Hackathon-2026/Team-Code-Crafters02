'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { cn } from '../../lib/utils';

interface AnimatedNumberProps {
    value: number;
    duration?: number;
    className?: string;
    prefix?: string;
    suffix?: string;
    decimals?: number;
}

export function AnimatedNumber({
    value,
    className,
    prefix = '',
    suffix = '',
    decimals = 0,
}: AnimatedNumberProps) {
    const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (current) => {
        return `${prefix}${current.toFixed(decimals)}${suffix}`;
    });

    const [renderedValue, setRenderedValue] = useState<string>(
        `${prefix}${value.toFixed(decimals)}${suffix}`
    );

    useEffect(() => {
        spring.set(value);
    }, [spring, value]);

    useEffect(() => {
        return display.on('change', (latest) => {
            setRenderedValue(latest);
        });
    }, [display]);

    return (
        <span className={cn('tabular-nums font-mono', className)}>
            {renderedValue}
        </span>
    );
}
