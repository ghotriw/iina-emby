import type React from "react";
import { useId } from "react";

interface IINAEmbyLogoProps {
  size?: number;
  className?: string;
}

export function IINAEmbyLogo({ size = 68, className }: IINAEmbyLogoProps) {
  const uid = useId().replace(/:/g, "");
  const lg1 = `lg1-${uid}`;
  const p2 = `p2-${uid}`;
  const f3 = `f3-${uid}`;
  const f4 = `f4-${uid}`;
  const p5 = `p5-${uid}`;
  const f6 = `f6-${uid}`;
  const f7 = `f7-${uid}`;
  const lg8 = `lg8-${uid}`;
  const p9 = `p9-${uid}`;
  const f10 = `f10-${uid}`;
  const f11 = `f11-${uid}`;

  // Aspect ratio is 685.687379 / 527.838541 ≈ 1.299
  const width = Math.round(size * 1.3);
  const height = size;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 685.687379 527.838541"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="IINA Logo"
    >
      <defs>
        <linearGradient x1="22.9348776%" y1="50%" x2="100%" y2="50%" id={lg1}>
          <stop stopColor="#7437F2" offset="0%" />
          <stop stopColor="#425AFE" offset="100%" />
        </linearGradient>

        <rect id={p2} x="0" y="187" width="55" height="139" rx="27.5" />

        <filter x="-138.2%" y="-53.2%" width="376.4%" height="209.4%" filterUnits="objectBoundingBox" id={f3}>
          <feOffset dx="0" dy="2" in="SourceAlpha" result="shadowOffsetOuter1" />
          <feGaussianBlur stdDeviation="25" in="shadowOffsetOuter1" result="shadowBlurOuter1" />
          <feComposite in="shadowBlurOuter1" in2="SourceAlpha" operator="out" result="shadowBlurOuter1" />
          <feColorMatrix values="0 0 0 0 0.314   0 0 0 0 0.098   0 0 0 0 0.80  0 0 0 0.65 0" type="matrix" in="shadowBlurOuter1" />
        </filter>

        <filter x="-112.7%" y="-43.2%" width="325.5%" height="189.2%" filterUnits="objectBoundingBox" id={f4}>
          <feGaussianBlur stdDeviation="12" in="SourceAlpha" result="shadowBlurInner1" />
          <feOffset dx="0" dy="0" in="shadowBlurInner1" result="shadowOffsetInner1" />
          <feComposite in="shadowOffsetInner1" in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowInnerInner1" />
          <feColorMatrix values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.5 0" type="matrix" in="shadowInnerInner1" />
        </filter>

        <rect id={p5} x="80" y="155" width="70" height="204" rx="35" />

        <filter x="-107.1%" y="-36.8%" width="314.3%" height="173.5%" filterUnits="objectBoundingBox" id={f6}>
          <feOffset dx="0" dy="0" in="SourceAlpha" result="shadowOffsetOuter1" />
          <feGaussianBlur stdDeviation="25" in="shadowOffsetOuter1" result="shadowBlurOuter1" />
          <feComposite in="shadowBlurOuter1" in2="SourceAlpha" operator="out" result="shadowBlurOuter1" />
          <feColorMatrix values="0 0 0 0 0.20   0 0 0 0 0.075   0 0 0 0 0.72  0 0 0 0.65 0" type="matrix" in="shadowBlurOuter1" />
        </filter>

        <filter x="-90.0%" y="-30.9%" width="280.0%" height="161.8%" filterUnits="objectBoundingBox" id={f7}>
          <feGaussianBlur stdDeviation="12" in="SourceAlpha" result="shadowBlurInner1" />
          <feOffset dx="2" dy="0" in="shadowBlurInner1" result="shadowOffsetInner1" />
          <feComposite in="shadowOffsetInner1" in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowInnerInner1" />
          <feColorMatrix values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.504889642 0" type="matrix" in="shadowInnerInner1" />
        </filter>

        <linearGradient x1="50%" y1="1.84492574%" x2="50%" y2="100%" id={lg8}>
          <stop stopColor="#00E4FB" offset="0%" />
          <stop stopColor="#0089F9" offset="100%" />
        </linearGradient>

        <path
          d="M475.018774,124.893792 L626.932564,394.57021 C643.738473,424.403955 633.177325,462.212865 603.34358,479.018774 C594.055184,484.251101 583.574539,487 572.91379,487 L269.08621,487 C234.844555,487 207.08621,459.241654 207.08621,425 C207.08621,414.339252 209.835108,403.858606 215.067436,394.57021 L366.981226,124.893792 C383.787135,95.0600471 421.596045,84.4988992 451.42979,101.304808 C461.300232,106.865013 469.458568,115.02335 475.018774,124.893792 Z"
          id={p9}
        />

        <filter x="-5.0%" y="-3.4%" width="113.9%" height="120.9%" filterUnits="objectBoundingBox" id={f10}>
          <feOffset dx="10" dy="0" in="SourceAlpha" result="shadowOffsetOuter1" />
          <feGaussianBlur stdDeviation="25" in="shadowOffsetOuter1" result="shadowBlurOuter1" />
          <feComposite in="shadowBlurOuter1" in2="SourceAlpha" operator="out" result="shadowBlurOuter1" />
          <feColorMatrix values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.65 0" type="matrix" in="shadowBlurOuter1" />
        </filter>

        <filter x="-8.4%" y="-7.2%" width="120.7%" height="128.5%" filterUnits="objectBoundingBox" id={f11}>
          <feGaussianBlur stdDeviation="35" in="SourceAlpha" result="shadowBlurInner1" />
          <feOffset dx="-25" dy="0" in="shadowBlurInner1" result="shadowOffsetInner1" />
          <feComposite in="shadowOffsetInner1" in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowInnerInner1" />
          <feColorMatrix values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.62 0" type="matrix" in="shadowInnerInner1" />
        </filter>
      </defs>

      <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <g transform="translate(50.000000, -4.086210)">
          <g>
            <use fill="black" fillOpacity="1" filter={`url(#${f3})`} href={`#${p2}`} />
            <use fill={`url(#${lg1})`} fillRule="evenodd" href={`#${p2}`} />
            <use fill="black" fillOpacity="1" filter={`url(#${f4})`} href={`#${p2}`} />
            <rect stroke="#36353D" strokeWidth="1.5" strokeLinejoin="miter" x="0.75" y="187.75" width="53.5" height="137.5" rx="26.75" />
          </g>

          <g>
            <use fill="black" fillOpacity="1" filter={`url(#${f6})`} href={`#${p5}`} />
            <use fill="#425AFE" fillRule="evenodd" href={`#${p5}`} />
            <use fill="black" fillOpacity="1" filter={`url(#${f7})`} href={`#${p5}`} />
            <rect stroke="#36353D" strokeWidth="1.5" strokeLinejoin="miter" x="80.75" y="155.75" width="68.5" height="202.5" rx="34.25" />
          </g>

          <g transform="translate(421.000000, 258.000000) rotate(90.000000) translate(-421.000000, -258.000000)">
            <use fill="black" fillOpacity="1" filter={`url(#${f10})`} href={`#${p9}`} />
            <use fill={`url(#${lg8})`} fillRule="evenodd" href={`#${p9}`} />
            <use fill="black" fillOpacity="1" filter={`url(#${f11})`} href={`#${p9}`} />
            <path
              stroke="#36353D"
              strokeWidth="1.5"
              strokeLinejoin="miter"
              d="M404.521843,96.3317785 C419.619162,92.1146503 436.325261,93.6569551 451.061687,101.958261 C460.812729,107.451206 468.872376,115.510852 474.365321,125.261894 L626.279111,394.938313 C634.580417,409.674739 636.122722,426.380838 631.905593,441.478157 C627.688465,456.575476 617.711904,470.064015 602.975478,478.365321 C593.799441,483.534354 583.445578,486.25 572.91379,486.25 L269.08621,486.25 C252.172489,486.25 236.859989,479.39436 225.775919,468.31029 C214.691849,457.22622 207.83621,441.91372 207.83621,425 C207.83621,414.468212 210.551855,404.114349 215.720889,394.938313 L367.634679,125.261894 C375.935985,110.525468 389.424524,100.548907 404.521843,96.3317785 Z"
            />
          </g>
        </g>
      </g>
    </svg>
  );
}
