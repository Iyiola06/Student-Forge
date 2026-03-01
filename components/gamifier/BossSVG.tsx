'use client';

export default function BossSVG({ type, isHit }: { type: string, isHit: boolean }) {
    return (
        <div className={`relative transition-all duration-300 ${isHit ? 'animate-shake scale-95 brightness-150' : 'animate-float'}`}>
            <svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialGradient id="bossBody" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#4c1d95" stopOpacity="0.4" />
                    </radialGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Main Body */}
                <circle cx="120" cy="120" r="80" fill="url(#bossBody)" stroke="#7c3aed" strokeWidth="2" filter="url(#glow)" />

                {/* Core Eye */}
                <circle cx="120" cy="120" r="25" fill="#000" />
                <circle cx="120" cy="120" r="15" fill="#38bdf8" className="animate-pulse" />
                <circle cx="125" cy="115" r="5" fill="#fff" opacity="0.8" />

                {/* Tentacles/Energy Arms */}
                {[0, 60, 120, 180, 240, 300].map(angle => (
                    <path
                        key={angle}
                        d={`M 120 120 Q ${120 + Math.cos(angle * Math.PI / 180) * 120} ${120 + Math.sin(angle * Math.PI / 180) * 60} ${120 + Math.cos(angle * Math.PI / 180) * 100} ${120 + Math.sin(angle * Math.PI / 180) * 100}`}
                        stroke="#7c3aed"
                        strokeWidth="4"
                        strokeLinecap="round"
                        opacity="0.6"
                        className="animate-pulse"
                        style={{ transformOrigin: 'center', transform: `rotate(${Math.sin(Date.now() / 1000) * 10}deg)` }}
                    />
                ))}

                {/* Protective Field */}
                <circle cx="120" cy="120" r="95" stroke="#38bdf8" strokeWidth="1" strokeDasharray="10 20" opacity="0.3" className="animate-[spin_20s_linear_infinite]" />
            </svg>

            <style jsx>{`
                @keyframes shake {
                    0% { transform: translate(1px, 1px) rotate(0deg); }
                    10% { transform: translate(-1px, -2px) rotate(-1deg); }
                    20% { transform: translate(-3px, 0px) rotate(1deg); }
                    30% { transform: translate(3px, 2px) rotate(0deg); }
                    40% { transform: translate(1px, -1px) rotate(1deg); }
                    50% { transform: translate(-1px, 2px) rotate(-1deg); }
                    60% { transform: translate(-3px, 1px) rotate(0deg); }
                    70% { transform: translate(3px, 1px) rotate(-1deg); }
                    80% { transform: translate(-1px, -1px) rotate(1deg); }
                    90% { transform: translate(1px, 2px) rotate(0deg); }
                    100% { transform: translate(1px, -2px) rotate(-1deg); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-10px) scale(1.05); }
                }
                .animate-shake {
                    animation: shake 0.5s infinite;
                }
                .animate-float {
                    animation: float 4s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
