import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react'; // BarChart3 remains removed


/* =========================================
PART 1: PARTICLES (Unchanged)
========================================= */

const HeatParticle = () => (
<motion.div
 initial={{ opacity: 0, y: 0, scale: 0.5 }}
 animate={{ opacity: [0, 0.8, 0], y: -80, x: Math.random() * 40 - 20, scale: 1.2 }}
 transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: Math.random() * 2 }}
 className="absolute w-3 h-3 bg-red-400 rounded-full blur-[2px]"
 style={{ left: '50%', top: 0 }}
/>
);

const BubbleParticle = () => {
const size = 6 + Math.random() * 10;
const randomX = Math.random() * 30 - 15;

return (
 <motion.div
 initial={{ opacity: 0, y: 20, scale: 0.6 }}
 animate={{
  opacity: [0, 0.7, 0],
  y: -100 - Math.random() * 40,
  scale: [0.6, 1.1, 1.3],
  x: [0, randomX, -randomX/2]
 }}
 transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, ease: "easeInOut", delay: Math.random() * 1.5 }}
 className="absolute rounded-full bg-teal-300/30 border border-teal-100/40 shadow-sm backdrop-blur-[1px]"
 style={{
  left: `${30 + Math.random() * 40}%`,
  top: '60%',
  width: `${size}px`,
  height: `${size}px`
 }}
 />
);
};

/* =========================================
PART 2: HOLOGRAPHIC GAUGE HUD (UPDATED)
========================================= */
const HolographicHUD = ({ isEfficient }) => {

const percent = isEfficient ? 94 : 42;

return (
 <motion.div
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 className="flex flex-col items-center" // Ensures all HUD content is centered
 >
 
 {/* --- RESPONSIVE CARD WRAPPER --- */}
 {/* Default (Small/Medium screens): Side by Side (flex-row) */}
 {/* Large screens (lg): Top/Bottom (lg:flex-col) */}
 <div className="flex gap-4 items-center flex-row lg:flex-col lg:gap-2">
 
  {/* 1. Main Gauge Box (The Circular Status Card) */}
  <div className="relative w-32 h-32 flex items-center justify-center
    bg-white/10 backdrop-blur-md rounded-full shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]
    border border-white/20">
  
   {/* Center Number */}
   <div className="relative z-10 flex flex-col items-center justify-center text-center">
    <motion.div
     key={isEfficient ? "high" : "low"}
     initial={{ scale: 0.8, opacity: 0 }}
     animate={{ scale: 1, opacity: 1 }}
     className={`text-5xl font-black ${isEfficient ? 'text-green-400' : 'text-red-400'} drop-shadow-sm`}
    >
     {isEfficient ? '94' : '42'}
     <span className="text-xl align-top ml-0.5 text-white/80">%</span>
    </motion.div>
   </div>
   
   {/* Status Pill (REVERTED TO ORIGINAL POSITION) */}
   <motion.div
    className={`absolute -bottom-3 px-3 py-1 rounded-full text-[10px] font-bold text-white shadow-lg ${isEfficient ? 'bg-green-500' : 'bg-red-500'}`}
    animate={{ scale: [1, 1.05, 1] }}
    transition={{ duration: 0.5 }}
    >
    {isEfficient ? 'OPTIMIZED' : 'LEAK DETECTED'}
   </motion.div>
  </div>

  {/* 2. Energy Card (Adjusted placement and vertical spacing for large screens) */}
  <div className="bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-lg border border-white/50 w-20 text-center lg:mt-5">
   <div className="flex items-center justify-center gap-1 text-gray-500 text-[8px] font-bold uppercase mb-0.5">
    <Zap className="w-3 h-3" /> Energy
   </div>
   <div className="text-sm font-bold text-gray-800 leading-tight">
    {isEfficient ? '210' : '850'} <span className="text-[10px] font-normal text-gray-500 block">kW</span>
   </div>
  </div>

 </div>
 </motion.div>
);
};


/* =========================================
PART 3: BUILDINGS (Unchanged)
========================================= */
const AnimatedBuilding = ({ isEfficient, isScanning, className = "", showLabel = false }) => {
const roofColorVariant = isEfficient ? '#3b82f6' : '#ef4444';
const windowGlowOpacity = isEfficient ? 0.1 : 0.7;

return (
 <motion.div
 className={`relative flex items-end justify-center ${className}`}
 animate={{ scale: isScanning ? 0.98 : 1 }}
 transition={{ duration: 0.5 }}
 >
 <AnimatePresence>
  {!isEfficient && (
  <motion.div
   initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
   className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
  >
   {Array.from({ length: 8 }).map((_, i) => <HeatParticle key={i} />)}
  </motion.div>
  )}
 </AnimatePresence>

  <AnimatePresence>
  {isEfficient && (
  <motion.div
   initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
   className="absolute inset-0 pointer-events-none z-20"
  >
   {Array.from({ length: 8 }).map((_, i) => <BubbleParticle key={i} />)}
  </motion.div>
  )}
 </AnimatePresence>

 <div className="relative z-10 w-full h-full drop-shadow-2xl origin-bottom">
  <svg viewBox="0 0 200 220" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
  <defs>
   <filter id="windowGlow" x="-50%" y="-50%" width="200%" height="200%">
   <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
   </filter>
  </defs>
  <rect x="20" y="60" width="160" height="140" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="2" rx="4" />
  <rect x="20" y="130" width="160" height="70" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="2" rx="4" />
  <rect x="85" y="160" width="30" height="40" fill="#374151" rx="2" />
  <line x1="100" y1="160" x2="100" y2="200" stroke="#4b5563" strokeWidth="2" />
  <g className="windows-top">
   <rect x="35" y="80" width="50" height="35" fill="#bfdbfe" stroke="#60a5fa" strokeWidth="2" rx="2"/>
   <motion.rect x="35" y="80" width="50" height="35" fill="#fef08a" rx="2" filter="url(#windowGlow)"
    animate={{ opacity: windowGlowOpacity }} />
   <rect x="115" y="80" width="50" height="35" fill="#bfdbfe" stroke="#60a5fa" strokeWidth="2" rx="2"/>
   <motion.rect x="115" y="80" width="50" height="35" fill="#fef08a" rx="2" filter="url(#windowGlow)"
    animate={{ opacity: windowGlowOpacity }} />
  </g>
  <g className="windows-bottom">
   <rect x="35" y="165" width="30" height="25" fill="#bfdbfe" stroke="#60a5fa" strokeWidth="2" rx="2"/>
   <motion.rect x="35" y="165" width="30" height="25" fill="#fef08a" rx="2" filter="url(#windowGlow)"
    animate={{ opacity: windowGlowOpacity }} />
   <rect x="135" y="165" width="30" height="25" fill="#bfdbfe" stroke="#60a5fa" strokeWidth="2" rx="2"/>
   <motion.rect x="135" y="165" width="30" height="25" fill="#fef08a" rx="2" filter="url(#windowGlow)"
    animate={{ opacity: windowGlowOpacity }} />
  </g>
  <rect x="15" y="125" width="170" height="8" fill="#9ca3af" rx="1" />
  <motion.path
   d="M 10 60 L 190 60 L 190 20 L 10 40 Z"
   fill={roofColorVariant}
   stroke={isEfficient ? '#2563eb' : '#dc2626'}
   strokeWidth="2"
   animate={{ fill: roofColorVariant, stroke: isEfficient ? '#2563eb' : '#dc2626' }}
   transition={{ duration: 1 }}
   className="drop-shadow-md"
  />
   <rect x="130" y="10" width="30" height="15" fill="#6b7280" rx="1"/>
   <rect x="135" y="15" width="20" height="3" fill="#374151" rx="0.5"/>
   <rect x="135" y="20" width="20" height="3" fill="#374151" rx="0.5"/>
  </svg>
 </div>
 <AnimatePresence>
  {isScanning && (
  <motion.div
   initial={{ top: '-10%', opacity: 0 }}
   animate={{ top: '110%', opacity: [0, 1, 1, 0] }}
   exit={{ opacity: 0 }}
   transition={{ duration: 2, ease: "easeInOut" }}
   className="absolute left-[-10%] right-[-10%] h-6 bg-blue-400 blur-xl z-30 mix-blend-screen"
  />
  )}
 </AnimatePresence>
 </motion.div>
);
};


/* =========================================
PART 4: MAIN COMPONENT
========================================= */

const DynamicHero = () => {
// --- STATE ---
const [isEfficient, setIsEfficient] = useState(false);
const [isScanning, setIsScanning] = useState(false);
const heroRef = useRef(null);
const [t, setT] = useState(0.25);

// --- EFFECTS ---
useEffect(() => {
 const cycle = setInterval(() => {
 setIsScanning(true);
 setTimeout(() => {
  setIsEfficient(prev => !prev);
 }, 1000);
 setTimeout(() => {
  setIsScanning(false);
 }, 2000);
 }, 6000);
 return () => clearInterval(cycle);
}, []);

useEffect(() => {
 let current = t;
 const cycle = 14000;
 let rafHandle;
 
 const frame = () => {
 current += 16 / cycle;
 if (current >= 1) current = 0;
 setT(current);
 rafHandle = requestAnimationFrame(frame);
 };
 
 rafHandle = requestAnimationFrame(frame);
 return () => cancelAnimationFrame(rafHandle);
}, [t]);

// --- CALCULATIONS ---
const isDay = t < 0.5;
const defaultTextColor = isDay ? "text-gray-900" : "text-white";
const secondaryTextColor = isDay ? "text-gray-700" : "text-gray-300";

const getSky = () => {
 if (t < 0.25) return "linear-gradient(to bottom,#9fd9ff,#d7efff)";
 if (t < 0.5) return "linear-gradient(to bottom,#6bb5ff,#ffd397)";
 if (t < 0.75) return "linear-gradient(to bottom,#1b1d3a,#0a0f1a)";
 return "linear-gradient(to bottom,#081229,#2d456d)";
};

// --- BUILDING RENDERING (Always three buildings) ---
  const renderBuildings = () => {
    return (
      <div className="flex items-end justify-center relative pb-0 z-10 w-full">
        {/* Left Small Building: Reduced size and spacing on mobile */}
        <AnimatedBuilding
          isEfficient={isEfficient}
          isScanning={isScanning}
          // Smaller base size, scales up
          className="w-[100px] h-[100px] sm:w-[140px] sm:h-[140px] lg:w-[200px] lg:h-[200px] z-10 opacity-80 -mr-4 lg:-mr-12 mb-2 lg:mb-4"
        />
        {/* Main Center Building */}
        <AnimatedBuilding
          isEfficient={isEfficient}
          isScanning={isScanning}
          // Smaller base size, scales up
          className="w-[180px] h-[180px] sm:w-[240px] sm:h-[240px] lg:w-[340px] lg:h-[340px] z-20 drop-shadow-2xl"
          showLabel={true}
        />
        {/* Right Small Building: Reduced size and spacing on mobile */}
        <AnimatedBuilding
          isEfficient={isEfficient}
          isScanning={isScanning}
          // Smaller base size, scales up
          className="w-[100px] h-[100px] sm:w-[140px] sm:h-[140px] lg:w-[200px] lg:h-[200px] z-10 opacity-80 -ml-4 lg:-ml-12 mb-2 lg:mb-4"
        />
      </div>
    );
  };


return (
 <section
 ref={heroRef}
 className="relative w-full flex items-center justify-center overflow-hidden font-sans pt-28 pb-10 min-h-screen"
 style={{
  background: getSky(),
  transition: "background 1s linear",
  minHeight: "100vh",
 }}
 >
 
 {/* --- GREEN LAND BASE --- */}
 <div
  style={{
   position: "absolute",
   bottom: 0,
   width: "100%",
   height: "400px",
   background: "radial-gradient(circle at center top, #6fcf73, #4b8f4d)",
   borderTopLeftRadius: "50%",
   borderTopRightRadius: "50%",
   transform: "scaleX(1.4)",
   zIndex: 2,
   pointerEvents: "none",
  }}
 />
 
   {/* Container Grid: Text Top/Left, Buildings Bottom/Right */}
 <div className="container mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center h-full min-h-[500px]">
 
  {/* --- LEFT/TOP: TEXT CONTENT --- */}
  <div className="text-center lg:text-left relative z-30 order-1 lg:order-1">
   <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto lg:mx-0"
   >
    <motion.h1
     className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
     initial={{ opacity: 0, y: 50 }}
     animate={{ opacity: 1, y: 0 }}
     transition={{ duration: 0.6, delay: 0.1 }}
    >
     <span className={`${defaultTextColor} transition-colors duration-1000`}>
      Smarter
     </span>
     <br />
     <span className={`${defaultTextColor} transition-colors duration-1000`}>
      Sustainable
     </span>
     <br />
     <span className={`${defaultTextColor} transition-colors duration-1000`}>Energy Future</span>
    </motion.h1>

    <motion.p
     className={`text-xl md:text-2xl ${secondaryTextColor} transition-colors duration-1000 mb-8 leading-relaxed`}
     initial={{ opacity: 0, y: 30 }}
     animate={{ opacity: 1, y: 0 }}
     transition={{ duration: 0.6, delay: 0.3 }}
    >
     We combine AI and data analytics to predict and optimize energy resources across homes and industries.
    </motion.p>
   </motion.div>
  </div>

  {/* --- RIGHT/BOTTOM: ANIMATED BUILDINGS CONTAINER --- */}
  <div className="relative h-full min-h-[400px] w-full flex items-end justify-center lg:justify-end order-2 lg:order-2">
  
  {/* THE HUD: TOP CENTER */}
  <div className="absolute top-0 w-full flex justify-center z-50">
   <HolographicHUD isEfficient={isEfficient} />
  </div>

  {/* Always render three buildings, with adjusted mobile sizing. */}
  <div className="mb-[250px] lg:mb-[100px] w-full">
   {renderBuildings()}
  </div>

  </div>

 </div>
 </section>
);
};

export default DynamicHero;