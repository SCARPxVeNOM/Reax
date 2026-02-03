'use client';

import React, { useRef, useEffect, ReactNode } from 'react';
import gsap from 'gsap';

interface GradientTextProps {
    children: ReactNode;
    gradient?: string;
    animate?: boolean;
    className?: string;
    as?: 'span' | 'h1' | 'h2' | 'h3' | 'p';
}

export const GradientText: React.FC<GradientTextProps> = ({
    children,
    gradient = 'from-blue-400 via-purple-500 to-pink-500',
    animate = false,
    className = '',
    as: Component = 'span',
}) => {
    const textRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (!textRef.current || !animate) return;

        // Create shimmer animation
        gsap.to(textRef.current, {
            backgroundPosition: '200% center',
            duration: 3,
            repeat: -1,
            ease: 'linear',
        });
    }, [animate]);

    return (
        <Component
            ref={textRef as any}
            className={`
        bg-gradient-to-r ${gradient}
        bg-clip-text text-transparent
        bg-[length:200%_auto]
        ${className}
      `}
        >
            {children}
        </Component>
    );
};

// Animated text reveal component
export const TextReveal: React.FC<{
    children: string;
    className?: string;
    delay?: number;
}> = ({ children, className = '', delay = 0 }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const chars = containerRef.current.querySelectorAll('.char');

        gsap.fromTo(
            chars,
            {
                opacity: 0,
                y: 40,
                rotateX: -90,
            },
            {
                opacity: 1,
                y: 0,
                rotateX: 0,
                duration: 0.6,
                stagger: 0.03,
                delay,
                ease: 'back.out(1.7)',
            }
        );
    }, [delay]);

    return (
        <div ref={containerRef} className={`inline-block ${className}`}>
            {children.split('').map((char, i) => (
                <span
                    key={i}
                    className="char inline-block"
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    {char === ' ' ? '\u00A0' : char}
                </span>
            ))}
        </div>
    );
};

export default GradientText;
