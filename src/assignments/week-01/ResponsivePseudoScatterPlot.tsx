import { useEffect, useRef } from 'react';
import { select } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { useDimensions } from './useDimensions';

interface DataPoint {
  x: number;
  y: number;
}

interface BouncingCircle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

const data: DataPoint[] = [
  { x: 132, y: 391 },
  { x: 330, y: 349 },
  { x: 410, y: 192 },
  { x: 527, y: 257 },
  { x: 688, y: 119 },
  { x: 878, y: 55 },
];

const ORIGINAL_WIDTH = 960;
const ORIGINAL_HEIGHT = 500;
const RADIUS = 34;
const RAINBOW_COLORS = ['#e11d48', '#f97316', '#facc15', '#22c55e', '#2563eb', '#7c3aed'];
const VELOCITIES = [
  { vx: 110, vy: 160 },
  { vx: 150, vy: -120 },
  { vx: -135, vy: 145 },
  { vx: 125, vy: 105 },
  { vx: -155, vy: -135 },
  { vx: 95, vy: -170 },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function ResponsivePseudoScatterPlot() {
  const svgRef = useRef<SVGSVGElement>(null);
  const { ref: divRef, dimensions } = useDimensions();

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || dimensions.width === 0 || dimensions.height === 0) return;

    const xScale = scaleLinear().domain([0, ORIGINAL_WIDTH]).range([0, dimensions.width]);

    const yScale = scaleLinear().domain([0, ORIGINAL_HEIGHT]).range([0, dimensions.height]);

    const radius = Math.min(RADIUS, dimensions.width / 10, dimensions.height / 10);
    const bounds = {
      minX: radius,
      maxX: dimensions.width - radius,
      minY: radius,
      maxY: dimensions.height - radius,
    };

    const circles: BouncingCircle[] = data.map((d, index) => {
      const velocity = VELOCITIES[index % VELOCITIES.length];

      return {
        x: clamp(xScale(d.x), bounds.minX, bounds.maxX),
        y: clamp(yScale(d.y), bounds.minY, bounds.maxY),
        vx: velocity.vx,
        vy: velocity.vy,
        color: RAINBOW_COLORS[index % RAINBOW_COLORS.length],
      };
    });

    const circleSelection = select(svg)
      .selectAll<SVGCircleElement, BouncingCircle>('circle')
      .data(circles)
      .join('circle')
      .attr('r', radius)
      .attr('fill', (d: BouncingCircle) => d.color);

    const render = () => {
      circleSelection.attr('cx', (d: BouncingCircle) => d.x).attr('cy', (d: BouncingCircle) => d.y);
    };

    let animationFrame = 0;
    let previousTimestamp = 0;

    const animate = (timestamp: number) => {
      const elapsedSeconds =
        previousTimestamp === 0 ? 0 : Math.min((timestamp - previousTimestamp) / 1000, 0.05);
      previousTimestamp = timestamp;

      circles.forEach((circle) => {
        circle.x += circle.vx * elapsedSeconds;
        circle.y += circle.vy * elapsedSeconds;

        if (circle.x <= bounds.minX || circle.x >= bounds.maxX) {
          circle.vx *= -1;
          circle.x = clamp(circle.x, bounds.minX, bounds.maxX);
        }

        if (circle.y <= bounds.minY || circle.y >= bounds.maxY) {
          circle.vy *= -1;
          circle.y = clamp(circle.y, bounds.minY, bounds.maxY);
        }
      });

      render();
      animationFrame = requestAnimationFrame(animate);
    };

    render();
    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [dimensions]);

  return (
    <div ref={divRef} className="relative w-full h-full">
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full"
        role="img"
        aria-label="Animated bouncing circles"
      ></svg>
    </div>
  );
}
