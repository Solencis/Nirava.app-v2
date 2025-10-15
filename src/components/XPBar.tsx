import React, { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, Star } from 'lucide-react';

interface XPBarProps {
  current: number;
  max: number;
  label: string;
  variant?: 'level' | 'weekly';
  level?: number;
  showAnimation?: boolean;
  compact?: boolean;
}

const XPBar: React.FC<XPBarProps> = ({
  current,
  max,
  label,
  variant = 'level',
  level,
  showAnimation = false,
  compact = false
}) => {
  const [displayXP, setDisplayXP] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const percentage = Math.min((current / max) * 100, 100);

  useEffect(() => {
    if (showAnimation) {
      setIsAnimating(true);
      let start = 0;
      const increment = current / 30;
      const timer = setInterval(() => {
        start += increment;
        if (start >= current) {
          setDisplayXP(current);
          clearInterval(timer);
          setTimeout(() => setIsAnimating(false), 500);
        } else {
          setDisplayXP(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(timer);
    } else {
      setDisplayXP(current);
    }
  }, [current, showAnimation]);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-stone/10 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ease-out ${
              variant === 'level'
                ? 'bg-gradient-to-r from-jade via-wasabi to-forest'
                : 'bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-stone/70 dark:text-gray-400 font-medium whitespace-nowrap transition-colors duration-300">
          {displayXP}/{max}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative ${
        variant === 'level'
          ? 'bg-gradient-to-br from-jade/5 to-forest/5'
          : 'bg-gradient-to-br from-blue-50 to-cyan-50'
      } rounded-2xl p-4 border ${
        variant === 'level' ? 'border-jade/20' : 'border-blue-200'
      } overflow-hidden`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
        {variant === 'level' ? (
          <Star className="w-full h-full text-jade" />
        ) : (
          <TrendingUp className="w-full h-full text-blue-500" />
        )}
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {variant === 'level' ? (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-jade to-forest flex items-center justify-center text-white font-bold shadow-lg">
                  {level || 1}
                </div>
                <div>
                  <div className="text-xs text-stone/60 dark:text-gray-400 font-medium transition-colors duration-300">{label}</div>
                  <div className="text-lg font-bold text-ink dark:text-white transition-colors duration-300">Niveau {level || 1}</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white shadow-md">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-stone/60 dark:text-gray-400 font-medium transition-colors duration-300">{label}</div>
                  <div className="text-base font-bold text-ink dark:text-white transition-colors duration-300">Cette semaine</div>
                </div>
              </div>
            )}
          </div>

          <div className="text-right">
            <div
              className={`text-2xl font-bold ${
                variant === 'level' ? 'text-jade' : 'text-blue-600'
              } ${isAnimating ? 'animate-pulse' : ''}`}
            >
              {displayXP}
            </div>
            <div className="text-xs text-stone/60 dark:text-gray-400 transition-colors duration-300">/ {max} XP</div>
          </div>
        </div>

        <div className="relative">
          <div className="h-3 bg-white/50 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner transition-colors duration-300">
            <div
              className={`h-full transition-all duration-700 ease-out relative ${
                variant === 'level'
                  ? 'bg-gradient-to-r from-jade via-wasabi to-forest'
                  : 'bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400'
              }`}
              style={{ width: `${percentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>

          {isAnimating && (
            <div className="absolute -top-8 right-0 flex items-center gap-1 animate-float-up">
              <Sparkles className="w-4 h-4 text-jade" />
              <span className="text-sm font-bold text-jade">+{current}!</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-2 text-xs">
          <span className="text-stone/60 dark:text-gray-400 transition-colors duration-300">
            {Math.round(percentage)}% complété
          </span>
          <span className="text-stone/60 font-medium">
            {max - current} XP restants
          </span>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes float-up {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(-20px);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .animate-float-up {
          animation: float-up 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default XPBar;
