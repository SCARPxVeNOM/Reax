'use client';

import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface GlowButtonProps {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost' | 'pulse';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    disabled?: boolean;
    icon?: React.ReactNode;
    animated?: boolean;
    type?: 'button' | 'submit' | 'reset';
}

export const GlowButton: React.FC<GlowButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    onClick,
    disabled,
    icon,
    animated = false,
    type = 'button',
}) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!buttonRef.current || !glowRef.current || !animated) return;

        const button = buttonRef.current;
        const glow = glowRef.current;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            gsap.to(glow, {
                x: x - glow.offsetWidth / 2,
                y: y - glow.offsetHeight / 2,
                opacity: 1,
                duration: 0.3,
            });
        };

        const handleMouseLeave = () => {
            gsap.to(glow, { opacity: 0, duration: 0.3 });
        };

        const handleMouseDown = () => {
            gsap.to(button, { scale: 0.95, duration: 0.1 });
        };

        const handleMouseUp = () => {
            gsap.to(button, { scale: 1, duration: 0.3, ease: 'elastic.out(1, 0.3)' });
        };

        button.addEventListener('mousemove', handleMouseMove);
        button.addEventListener('mouseleave', handleMouseLeave);
        button.addEventListener('mousedown', handleMouseDown);
        button.addEventListener('mouseup', handleMouseUp);

        return () => {
            button.removeEventListener('mousemove', handleMouseMove);
            button.removeEventListener('mouseleave', handleMouseLeave);
            button.removeEventListener('mousedown', handleMouseDown);
            button.removeEventListener('mouseup', handleMouseUp);
        };
    }, [animated]);

    const variants = {
        primary: 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25',
        secondary: 'bg-white/5 backdrop-blur-lg border border-white/10 text-white hover:bg-white/10',
        ghost: 'bg-transparent text-white hover:bg-white/5',
        pulse: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/40 animate-pulse-glow',
    };

    const sizes = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
    };

    return (
        <button
            ref={buttonRef}
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`
        relative overflow-hidden rounded-xl font-semibold
        transition-all duration-300 ease-out
        ${variants[variant]}
        ${sizes[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
        >
            {/* Glow effect */}
            <div
                ref={glowRef}
                className="absolute w-32 h-32 bg-white/30 rounded-full blur-xl pointer-events-none opacity-0"
                style={{ transform: 'translate(-50%, -50%)' }}
            />

            {/* Content */}
            <span className="relative z-10 flex items-center justify-center gap-2">
                {icon && <span className="text-lg">{icon}</span>}
                {children}
            </span>

            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        </button>
    );
};

export default GlowButton;
