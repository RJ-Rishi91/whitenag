import React from 'react';
import { Lottie } from 'lottie-react';

/**
 * Procedural Lottie-compatible Bodymovin JSON definitions for lightweight, zero-network-dependency animations
 */

// 1. Radar Pulse (Syncing / Listening)
const radarPulseJson = {
  v: "5.5.7",
  fr: 30,
  ip: 0,
  op: 60,
  w: 120,
  h: 120,
  nm: "RadarPulse",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "PulseRing2",
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 15, s: [80] },
            { t: 60, s: [0] }
          ]
        },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [60, 60, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 15, s: [30, 30, 100] },
            { t: 60, s: [140, 140, 100] }
          ]
        }
      },
      shapes: [
        {
          ty: "el",
          d: 1,
          p: { a: 0, k: [0, 0] },
          s: { a: 0, k: [40, 40] }
        },
        {
          ty: "st",
          c: { a: 0, k: [0.08, 0.65, 0.45, 1] },
          o: { a: 0, k: 100 },
          w: { a: 0, k: 3 }
        }
      ]
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "PulseRing1",
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 0, s: [100] },
            { t: 45, s: [0] }
          ]
        },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [60, 60, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [20, 20, 100] },
            { t: 45, s: [120, 120, 100] }
          ]
        }
      },
      shapes: [
        {
          ty: "el",
          d: 1,
          p: { a: 0, k: [0, 0] },
          s: { a: 0, k: [40, 40] }
        },
        {
          ty: "st",
          c: { a: 0, k: [0.85, 0.35, 0.05, 1] },
          o: { a: 0, k: 100 },
          w: { a: 0, k: 3 }
        }
      ]
    },
    {
      ddd: 0,
      ind: 3,
      ty: 4,
      nm: "CenterDot",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [60, 60, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [90, 90, 100] },
            { t: 30, s: [110, 110, 100] },
            { t: 60, s: [90, 90, 100] }
          ]
        }
      },
      shapes: [
        {
          ty: "el",
          d: 1,
          p: { a: 0, k: [0, 0] },
          s: { a: 0, k: [22, 22] }
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.85, 0.35, 0.05, 1] },
          o: { a: 0, k: 100 }
        }
      ]
    }
  ]
};

// 2. Success Checkmark
const successCheckJson = {
  v: "5.5.7",
  fr: 30,
  ip: 0,
  op: 45,
  w: 100,
  h: 100,
  nm: "SuccessCheck",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Circle",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [0, 0, 100] },
            { t: 20, s: [105, 105, 100] },
            { t: 28, s: [100, 100, 100] }
          ]
        }
      },
      shapes: [
        {
          ty: "el",
          d: 1,
          p: { a: 0, k: [0, 0] },
          s: { a: 0, k: [70, 70] }
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.06, 0.65, 0.38, 1] },
          o: { a: 0, k: 100 }
        }
      ]
    }
  ]
};

export function RadarPulseAnimation({ size = 48, className = "" }) {
  return (
    <div style={{ width: size, height: size }} className={`relative inline-flex items-center justify-center ${className}`}>
      <Lottie animationData={radarPulseJson} loop={true} />
    </div>
  );
}

export function SuccessCheckAnimation({ size = 56, className = "" }) {
  return (
    <div style={{ width: size, height: size }} className={`inline-flex items-center justify-center ${className}`}>
      <Lottie animationData={successCheckJson} loop={false} />
    </div>
  );
}

/**
 * Animated SVG Delivery Van in Motion with turning wheels and road dust
 */
export function DeliveryVanMotion({ className = "", width = 140, height = 70 }) {
  return (
    <div className={`relative inline-block ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 160 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-van-bounce"
      >
        {/* Speed trail dust */}
        <path d="M5 56 H30" stroke="#EADBC8" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 6" />
        <path d="M12 62 H38" stroke="#D9580B" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 5" opacity="0.6" />

        {/* Van Main Body */}
        <rect x="35" y="18" width="82" height="42" rx="6" fill="#03353A" />
        {/* Cabin */}
        <path d="M117 28 H134 C139 28 143 32 144 37 L147 48 C148 52 145 56 141 56 H117 V28 Z" fill="#D9580B" />
        {/* Cabin Window */}
        <path d="M120 32 H133 L140 44 H120 V32 Z" fill="#E5F3F6" opacity="0.9" />
        {/* Side Stripe */}
        <rect x="35" y="44" width="82" height="6" fill="#E8A317" />
        {/* Brand Text */}
        <text x="42" y="36" fill="#FFF7EE" fontSize="8" fontWeight="700" fontFamily="Outfit, sans-serif" letterSpacing="0.05em">
          NAGFANI
        </text>
        <text x="42" y="56" fill="#A3CED4" fontSize="6" fontWeight="500" fontFamily="Inter, sans-serif">
          Udaipur Logistics
        </text>
        {/* Front Headlight */}
        <circle cx="147" cy="51" r="3" fill="#FFF176" />
        <path d="M147 51 L158 48 L158 54 Z" fill="#FFF176" opacity="0.3" />

        {/* Wheels */}
        <g className="animate-spin-slow" style={{ transformOrigin: "54px 62px" }}>
          <circle cx="54" cy="62" r="9" fill="#1E2B2D" />
          <circle cx="54" cy="62" r="5" fill="#E0C0B3" />
          <circle cx="54" cy="62" r="2" fill="#1E2B2D" />
        </g>
        <g className="animate-spin-slow" style={{ transformOrigin: "126px 62px" }}>
          <circle cx="126" cy="62" r="9" fill="#1E2B2D" />
          <circle cx="126" cy="62" r="5" fill="#E0C0B3" />
          <circle cx="126" cy="62" r="2" fill="#1E2B2D" />
        </g>
      </svg>
      {/* Road strip */}
      <div className="w-full h-1 bg-[#EADBC8] rounded-full mt-[-2px] relative overflow-hidden">
        <div className="absolute top-0 bottom-0 w-8 bg-[#D9580B] animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Animated Manufacturing Plant Gears with dual interlocking counter-rotation
 */
export function ManufacturingGears({ size = 52, className = "" }) {
  return (
    <div style={{ width: size, height: size }} className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Big Gear */}
      <svg
        className="w-8 h-8 text-[#D9580B] animate-spin-slow absolute top-0 left-0"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97s-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1s.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z" />
      </svg>
      {/* Small Interlocking Gear */}
      <svg
        className="w-5 h-5 text-[#03353A] animate-spin-reverse absolute bottom-0 right-0"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97s-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1s.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z" />
      </svg>
    </div>
  );
}
