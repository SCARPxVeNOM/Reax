'use client';

import React, { useRef, useEffect, ReactNode } from 'react';
import gsap from 'gsap';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    hover3D?: boolean;
    glowColor?: string;
    onClick?: () => void;
    onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    className = '',
    hover3D = false,
    glowColor = 'rgba(139, 92, 246, 0.3)',
    onClick,
    onDragOver,
    onDragLeave,
    onDrop,
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!cardRef.current || !hover3D) return;

        const card = cardRef.current;
        const glow = glowRef.current;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;

            gsap.to(card, {
                rotateX: rotateX,
                rotateY: rotateY,
                duration: 0.3,
                ease: 'power2.out',
                transformPerspective: 1000,
            });

            if (glow) {
                gsap.to(glow, {
                    x: x - glow.offsetWidth / 2,
                    y: y - glow.offsetHeight / 2,
                    opacity: 0.8,
                    duration: 0.3,
                });
            }
        };

        const handleMouseLeave = () => {
            gsap.to(card, {
                rotateX: 0,
                rotateY: 0,
                duration: 0.5,
                ease: 'power3.out',
            });

            if (glow) {
                gsap.to(glow, { opacity: 0, duration: 0.3 });
            }
        };

        const handleMouseEnter = () => {
            gsap.to(card, {
                scale: 1.02,
                duration: 0.3,
                ease: 'power2.out',
            });
        };

        card.addEventListener('mousemove', handleMouseMove);
        card.addEventListener('mouseleave', handleMouseLeave);
        card.addEventListener('mouseenter', handleMouseEnter);

        return () => {
            card.removeEventListener('mousemove', handleMouseMove);
            card.removeEventListener('mouseleave', handleMouseLeave);
            card.removeEventListener('mouseenter', handleMouseEnter);
        };
    }, [hover3D]);

    return (
        <div
            ref={cardRef}
            onClick={onClick}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`
        relative overflow-hidden rounded-2xl
        bg-gradient-to-br from-white/10 to-white/5
        backdrop-blur-xl border border-white/10
        transition-all duration-300
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
            style={{ transformStyle: 'preserve-3d' }}
        >
            {/* Animated border gradient */}
            <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-purple-500/50 via-transparent to-blue-500/50 opacity-0 hover:opacity-100 transition-opacity duration-500" />

            {/* Glow effect */}
            <div
                ref={glowRef}
                className="absolute w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-0"
                style={{ background: glowColor }}
            />

            {/* Content */}
            <div className="relative z-10">{children}</div>

            {/* Subtle inner shadow */}
            <div className="absolute inset-0 rounded-2xl shadow-inner pointer-events-none" />
        </div>
    );
};

export default GlassCard;
