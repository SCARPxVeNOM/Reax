'use client';

import React, { InputHTMLAttributes, useState } from 'react';

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: React.ReactNode;
    wrapperClassName?: string;
    error?: string;
}

export const GlassInput: React.FC<GlassInputProps> = ({
    label,
    icon,
    wrapperClassName = '',
    className = '',
    error,
    onFocus,
    onBlur,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div className={`flex flex-col gap-1.5 ${wrapperClassName}`}>
            {label && (
                <label className="text-sm font-medium text-gray-400 ml-1">
                    {label}
                </label>
            )}

            <div className={`
        relative flex items-center
        rounded-xl overflow-hidden
        bg-white/5 border border-white/10
        transition-all duration-300
        ${isFocused ? 'bg-white/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'hover:bg-white/8 hover:border-white/20'}
        ${error ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : ''}
      `}>
                {icon && (
                    <div className={`
            pl-4 pr-2
            ${isFocused ? 'text-blue-400' : 'text-gray-500'}
            transition-colors duration-300
          `}>
                        {icon}
                    </div>
                )}

                <input
                    className={`
            w-full bg-transparent 
            py-3 px-4 ${icon ? 'pl-0' : ''}
            text-white placeholder-gray-500
            outline-none border-none
            text-sm font-medium
            ${className}
          `}
                    onFocus={(e) => {
                        setIsFocused(true);
                        onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        setIsFocused(false);
                        onBlur?.(e);
                    }}
                    autoComplete="off"
                    {...props}
                />
            </div>

            {error && (
                <span className="text-xs text-red-400 ml-1 animate-in">
                    {error}
                </span>
            )}
        </div>
    );
};

export default GlassInput;
