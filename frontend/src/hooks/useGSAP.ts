'use client';

import { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

// Base GSAP hook for component animations
export function useGSAP(
    animation: (ctx: gsap.Context) => void,
    dependencies: any[] = []
) {
    const scope = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!scope.current) return;

        const ctx = gsap.context(animation, scope);
        return () => ctx.revert();
    }, dependencies);

    return scope;
}

// Fade in animation hook
export function useFadeIn(delay: number = 0, duration: number = 0.8) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current) return;

        gsap.fromTo(
            ref.current,
            { opacity: 0, y: 30 },
            {
                opacity: 1,
                y: 0,
                duration,
                delay,
                ease: 'power3.out',
            }
        );
    }, [delay, duration]);

    return ref;
}

// Stagger children animation hook
export function useStagger(staggerDelay: number = 0.1) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current) return;

        const children = ref.current.children;
        gsap.fromTo(
            children,
            { opacity: 0, y: 40 },
            {
                opacity: 1,
                y: 0,
                duration: 0.6,
                stagger: staggerDelay,
                ease: 'power2.out',
            }
        );
    }, [staggerDelay]);

    return ref;
}

// Scroll trigger animation hook
export function useScrollTrigger(options?: ScrollTrigger.Vars) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current) return;

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: ref.current,
                start: 'top 80%',
                end: 'bottom 20%',
                toggleActions: 'play none none reverse',
                ...options,
            },
        });

        tl.fromTo(
            ref.current,
            { opacity: 0, y: 60 },
            { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
        );

        return () => {
            tl.kill();
        };
    }, []);

    return ref;
}

// Text reveal animation hook
export function useTextReveal() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current) return;

        const text = ref.current.textContent || '';
        ref.current.innerHTML = text
            .split('')
            .map((char) => `<span class="inline-block">${char === ' ' ? '&nbsp;' : char}</span>`)
            .join('');

        gsap.fromTo(
            ref.current.children,
            { opacity: 0, y: 20, rotateX: -90 },
            {
                opacity: 1,
                y: 0,
                rotateX: 0,
                duration: 0.5,
                stagger: 0.02,
                ease: 'back.out(1.7)',
            }
        );
    }, []);

    return ref;
}

// Magnetic button hook
export function useMagnetic(strength: number = 0.3) {
    const ref = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!ref.current) return;

        const element = ref.current;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            gsap.to(element, {
                x: x * strength,
                y: y * strength,
                duration: 0.3,
                ease: 'power2.out',
            });
        };

        const handleMouseLeave = () => {
            gsap.to(element, {
                x: 0,
                y: 0,
                duration: 0.5,
                ease: 'elastic.out(1, 0.3)',
            });
        };

        element.addEventListener('mousemove', handleMouseMove);
        element.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            element.removeEventListener('mousemove', handleMouseMove);
            element.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [strength]);

    return ref;
}

// Counter animation hook
export function useCounter(targetValue: number, duration: number = 2) {
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (!ref.current) return;

        const obj = { value: 0 };
        gsap.to(obj, {
            value: targetValue,
            duration,
            ease: 'power2.out',
            onUpdate: () => {
                if (ref.current) {
                    ref.current.textContent = Math.round(obj.value).toLocaleString();
                }
            },
        });
    }, [targetValue, duration]);

    return ref;
}

// Parallax effect hook
export function useParallax(speed: number = 0.5) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current) return;

        gsap.to(ref.current, {
            y: () => window.innerHeight * speed,
            ease: 'none',
            scrollTrigger: {
                trigger: ref.current,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
            },
        });
    }, [speed]);

    return ref;
}
