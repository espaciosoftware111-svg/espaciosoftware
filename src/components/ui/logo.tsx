import React from "react";
import Image from "next/image";

export interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  subtitle?: string;
  className?: string;
  collapsed?: boolean;
  light?: boolean;
  useFullGraphic?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = "md",
  showText = true,
  subtitle = "INTERIORS AND MODULAR",
  className = "",
  collapsed = false,
  light = false,
  useFullGraphic = false,
}) => {
  const sizeMap = {
    xs: { img: 26, box: "w-6 h-6", title: "text-xs", sub: "text-[8px]" },
    sm: { img: 36, box: "w-9 h-9", title: "text-sm", sub: "text-[9px]" },
    md: { img: 48, box: "w-12 h-12", title: "text-base", sub: "text-[10px]" },
    lg: { img: 64, box: "w-16 h-16", title: "text-lg", sub: "text-xs" },
    xl: { img: 88, box: "w-22 h-22", title: "text-xl", sub: "text-xs" },
  };

  const currentSize = sizeMap[size];

  if (useFullGraphic) {
    return (
      <div className={`select-none flex items-center justify-center ${className}`}>
        <Image
          src="/brand/espacio-logo.png"
          alt="ESPACIO Interiors and Modular"
          width={currentSize.img * 3}
          height={currentSize.img * 2.4}
          className="object-contain"
          priority
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* 100% Transparent Architectural Emblem Logo */}
      <div className={`${currentSize.box} shrink-0 flex items-center justify-center`}>
        <Image
          src="/brand/espacio-emblem.png"
          alt="ESPACIO Architectural Emblem"
          width={currentSize.img}
          height={currentSize.img}
          className="w-full h-full object-contain"
          priority
        />
      </div>

      {showText && !collapsed && (
        <div className="flex flex-col justify-center min-w-0">
          <h1
            className={`font-bold uppercase tracking-wider leading-none ${
              light ? "text-[#FAF6EF]" : "text-slate-900"
            } ${currentSize.title}`}
          >
            ESPACIO
          </h1>
          {subtitle && (
            <p
              className={`font-bold tracking-widest uppercase mt-1 leading-none ${
                light ? "text-[#C5A880]" : "text-[#786D5E]"
              } ${currentSize.sub}`}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
