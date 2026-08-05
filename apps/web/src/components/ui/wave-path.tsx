"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { useRef, useEffect, useCallback } from "react";

type WavePathProps = React.ComponentProps<"div">;

export function WavePath({ className, ...props }: WavePathProps) {
  const path = useRef<SVGPathElement>(null);
  const progressRef = useRef(0);
  const xRef = useRef(0.2);
  const timeRef = useRef(Math.PI / 2);
  const reqIdRef = useRef<number | null>(null);

  const setPath = useCallback((progress: number) => {
    const width = window.innerWidth * 0.7;
    if (path.current) {
      path.current.setAttributeNS(
        null,
        "d",
        `M0 100 Q${width * xRef.current} ${100 + progress * 0.6}, ${width} 100`,
      );
    }
  }, []);

  useEffect(() => {
    setPath(progressRef.current);
  }, [setPath]);

  const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;

  const resetAnimation = useCallback(() => {
    timeRef.current = Math.PI / 2;
    progressRef.current = 0;
  }, []);

  const animateOutRef = useRef<() => void>(() => {});
  useEffect(() => {
    animateOutRef.current = () => {
      const newProgress = progressRef.current * Math.sin(timeRef.current);
      progressRef.current = lerp(progressRef.current, 0, 0.025);
      timeRef.current += 0.2;
      setPath(newProgress);
      if (Math.abs(progressRef.current) > 0.75) {
        reqIdRef.current = requestAnimationFrame(animateOutRef.current);
      } else {
        resetAnimation();
      }
    };
  });

  const manageMouseEnter = useCallback(() => {
    if (reqIdRef.current) {
      cancelAnimationFrame(reqIdRef.current);
      resetAnimation();
    }
  }, [resetAnimation]);

  const manageMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const { movementY, clientX } = e;
      if (path.current) {
        const pathBound = path.current.getBoundingClientRect();
        xRef.current = (clientX - pathBound.left) / pathBound.width;
        progressRef.current += movementY;
        setPath(progressRef.current);
      }
    },
    [setPath],
  );

  const manageMouseLeave = useCallback(() => {
    animateOutRef.current();
  }, []);

  return (
    <div className={cn("relative h-px w-[70vw]", className)} {...props}>
      <div
        onMouseEnter={manageMouseEnter}
        onMouseMove={manageMouseMove}
        onMouseLeave={manageMouseLeave}
        className="relative -top-5 z-10 h-10 w-full hover:-top-[150px] hover:h-[300px]"
      />
      <svg className="absolute -top-[100px] h-[300px] w-full">
        <path ref={path} className="fill-none stroke-current" strokeWidth={2} />
      </svg>
    </div>
  );
}
