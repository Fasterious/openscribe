'use client';

import { useEffect, useRef } from 'react';

interface WaveformAnimationProps {
  className?: string;
  lineCount?: number;
  speed?: number;
}

export function WaveformAnimation({ 
  className = '', 
  lineCount = 18,
  speed = 0.015
}: WaveformAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const centerY = height / 2;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw multiple wave lines
      for (let i = 0; i < lineCount; i++) {
        const progress = i / (lineCount - 1); // 0 to 1
        
        // Color gradient: cyan/teal → indigo/violet
        const r = Math.round(78 + progress * (102 - 78));
        const g = Math.round(205 + progress * (126 - 205));
        const b = Math.round(196 + progress * (234 - 196));
        
        ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();

        // Line index from center (for spread effect)
        const lineFromCenter = (i - (lineCount - 1) / 2) / ((lineCount - 1) / 2);

        for (let x = 0; x <= width; x += 2) {
          // Normalized x position (0 to 1)
          const normalizedX = x / width;
          
          // Edge taper envelope
          const edgeEnvelope = Math.pow(Math.sin(normalizedX * Math.PI), 0.5);
          
          // Single traveling energy ball - smooth loop from -0.2 to 1.2
          const cycleLength = 1.4;
          const ballPosition = ((time * 0.08) % cycleLength) - 0.2;
          
          // Gaussian envelope - single peak that travels
          const gaussianWidth = 0.15;
          const distanceFromBall = normalizedX - ballPosition;
          const energyEnvelope = Math.exp(-Math.pow(distanceFromBall / gaussianWidth, 2));
          
          // Minimum energy (so lines don't completely disappear)
          const minEnergy = 0.05;
          const amplitudeEnvelope = energyEnvelope * (1 - minEnergy) + minEnergy;
          
          // High frequency carrier wave (the actual oscillation pattern)
          const carrierFreq = 25;
          const carrier = Math.sin(normalizedX * carrierFreq);
          
          // The wave shape - lines spread based on amplitude
          const waveAmplitude = carrier * amplitudeEnvelope * edgeEnvelope;
          
          // Base spread (max distance from center)
          const baseSpread = height * 0.38;
          
          // Calculate y: line position spreads proportionally to wave amplitude
          const y = centerY + lineFromCenter * baseSpread * Math.abs(waveAmplitude) * Math.sign(carrier);

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();
      }

      time += speed;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, [lineCount, speed]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`w-full ${className}`}
      style={{ height: '150px' }}
      aria-hidden="true"
    />
  );
}
