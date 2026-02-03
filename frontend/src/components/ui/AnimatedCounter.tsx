'use client';

import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';

interface AnimatedCounterProps {
    value: number | string;
    duration?: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
    value,
    duration = 2,
    prefix = '',
    suffix = '',
    decimals = 0,
    className = '',
}) => {
    const counterRef = useRef<HTMLSpanElement>(null);
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
        if (!counterRef.current || hasAnimated) return;

        const numericValue = typeof value === 'string'
            ? parseFloat(value.replace(/[^0-9.-]+/g, ''))
            : value;

        if (isNaN(numericValue)) {
            if (counterRef.current) {
                counterRef.current.textContent = `${prefix}${value}${suffix}`;
            }
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !hasAnimated) {
                        setHasAnimated(true);

                        const obj = { value: 0 };
                        gsap.to(obj, {
                            value: numericValue,
                            duration,
                            ease: 'power2.out',
                            onUpdate: () => {
                                if (counterRef.current) {
                                    const formatted = decimals > 0
                                        ? obj.value.toFixed(decimals)
                                        : Math.round(obj.value).toLocaleString();
                                    counterRef.current.textContent = `${prefix}${formatted}${suffix}`;
                                }
                            },
                        });
                    }
                });
            },
            { threshold: 0.5 }
        );

        observer.observe(counterRef.current);

        return () => observer.disconnect();
    }, [value, duration, prefix, suffix, decimals, hasAnimated]);

    return (
        <span ref={counterRef} className={`tabular-nums ${className}`}>
            {prefix}0{suffix}
        </span>
    );
};

export default AnimatedCounter;
