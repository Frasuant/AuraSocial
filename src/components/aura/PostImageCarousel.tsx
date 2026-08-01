"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function PostImageCarousel({
  images,
  fallbackColor,
}: {
  images: string[];
  fallbackColor: string;
}) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className={cn("relative aspect-[4/3] w-full bg-gradient-to-br", fallbackColor)}>
        <img src={images[0]} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>
    );
  }

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  };

  return (
    <div className="relative aspect-[4/3] w-full bg-black overflow-hidden">
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0"
        >
          <img src={images[index]} alt="" className="h-full w-full object-cover" />
        </motion.div>
      </AnimatePresence>

      {/* Prev/Next arrows */}
      {index > 0 && (
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 backdrop-blur-sm p-1.5 hover:bg-black/70 transition z-10"
          aria-label="Previous image"
        >
          <ChevronLeft className="h-5 w-5 text-white" />
        </button>
      )}
      {index < images.length - 1 && (
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 backdrop-blur-sm p-1.5 hover:bg-black/70 transition z-10"
          aria-label="Next image"
        >
          <ChevronRight className="h-5 w-5 text-white" />
        </button>
      )}

      {/* Dots indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              setIndex(i);
            }}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === index ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/70"
            )}
            aria-label={`Go to image ${i + 1}`}
          />
        ))}
      </div>

      {/* Counter badge */}
      <div className="absolute top-2 right-2 rounded-full bg-black/50 backdrop-blur-sm px-2 py-0.5 text-xs font-medium text-white z-10">
        {index + 1}/{images.length}
      </div>
    </div>
  );
}
