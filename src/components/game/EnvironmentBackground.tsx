"use client";

import { useState, useEffect } from "react";

interface EnvironmentBackgroundProps {
  environmentType: string;
}

export function EnvironmentBackground({
  environmentType,
}: EnvironmentBackgroundProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const getBackgroundImage = () => {
    // Convert environment type to lowercase and use as filename
    const imageName = environmentType.toLowerCase();
    return `/assets/${imageName}.webp`;
  };

  const getAmbientLight = () => {
    switch (environmentType) {
      case "dungeon_corridor":
        return (
          <>
            {/* Torch lights on the walls */}
            <div className="absolute top-20 left-10 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl animate-torch-flicker" />
            <div
              className="absolute top-40 right-10 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl animate-torch-flicker"
              style={{ animationDelay: "0.5s" }}
            />
            <div
              className="absolute bottom-20 left-1/3 w-24 h-24 bg-orange-500/15 rounded-full blur-2xl animate-torch-flicker"
              style={{ animationDelay: "1s" }}
            />
          </>
        );
      case "cave":
        return (
          <>
            <div className="absolute h-full w-full bg-gradient-to-t from-amber-900/10 via-transparent to-transparent" />
            {/* Cave torch spots */}
            <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-amber-600/15 rounded-full blur-3xl animate-torch-flicker" />
            <div
              className="absolute bottom-1/3 right-1/4 w-32 h-32 bg-amber-600/10 rounded-full blur-2xl animate-torch-flicker"
              style={{ animationDelay: "1.5s" }}
            />
          </>
        );
      case "training_ground":
        return (
          <>
            <div className="absolute h-full w-full bg-gradient-to-b from-yellow-300/5 via-transparent to-green-900/20" />
            {/* Sunlight rays */}
            <div className="absolute top-0 left-1/4 w-2 h-full bg-gradient-to-b from-yellow-200/20 to-transparent blur-sm" />
            <div className="absolute top-0 right-1/3 w-1 h-full bg-gradient-to-b from-yellow-200/15 to-transparent blur-sm" />
            <div className="absolute top-0 left-2/3 w-1 h-full bg-gradient-to-b from-yellow-200/10 to-transparent blur-sm" />
          </>
        );
      case "inn":
        return (
          <>
            <div className="absolute h-full w-full bg-gradient-to-b from-amber-900/5 via-transparent to-orange-900/10" />
            {/* Warm candlelight */}
            <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-orange-400/15 rounded-full blur-3xl animate-torch-flicker" />
            <div
              className="absolute top-1/3 right-1/4 w-32 h-32 bg-yellow-400/12 rounded-full blur-2xl animate-torch-flicker"
              style={{ animationDelay: "1s" }}
            />
            <div
              className="absolute bottom-1/3 left-1/2 w-36 h-36 bg-amber-400/10 rounded-full blur-3xl animate-torch-flicker"
              style={{ animationDelay: "2s" }}
            />
            {/* Fireplace glow - reduced opacity */}
            <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-gradient-to-t from-red-500/10 via-orange-500/5 to-transparent" />
          </>
        );
      case "missions":
        return (
          <>
            <div className="absolute h-full w-full bg-gradient-to-b from-blue-900/5 via-transparent to-purple-900/10" />
            {/* Mission board lighting */}
            <div className="absolute top-1/4 left-1/3 w-48 h-48 bg-blue-400/10 rounded-full blur-3xl animate-torch-flicker" />
            <div
              className="absolute top-1/2 right-1/3 w-40 h-40 bg-purple-400/8 rounded-full blur-2xl animate-torch-flicker"
              style={{ animationDelay: "1.5s" }}
            />
            <div
              className="absolute bottom-1/4 left-1/2 w-44 h-44 bg-indigo-400/6 rounded-full blur-3xl animate-torch-flicker"
              style={{ animationDelay: "3s" }}
            />
          </>
        );
      case "forest":
        return (
          <>
            <div className="absolute h-full w-full bg-gradient-to-b from-green-700/10 via-transparent to-black/30" />
            {/* Light rays through canopy */}
            <div className="absolute top-0 left-1/4 w-1 h-full bg-gradient-to-b from-yellow-200/10 to-transparent blur-sm" />
            <div className="absolute top-0 right-1/3 w-1 h-full bg-gradient-to-b from-yellow-200/10 to-transparent blur-sm" />
            <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gradient-to-b from-yellow-200/8 to-transparent blur-sm" />
          </>
        );
      case "crypt":
        return (
          <>
            <div className="absolute h-full w-full bg-purple-900/20" />
            <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-purple-500/10 to-transparent" />
            {/* Mystical glow spots */}
            <div className="absolute top-1/3 left-1/3 w-48 h-48 bg-purple-400/10 rounded-full blur-3xl animate-float-slow" />
            <div
              className="absolute bottom-1/4 right-1/3 w-32 h-32 bg-indigo-400/8 rounded-full blur-2xl animate-float-slow"
              style={{ animationDelay: "2s" }}
            />
          </>
        );
      case "ruins":
        return (
          <>
            <div className="absolute h-full w-full bg-gradient-to-b from-slate-800/20 via-transparent to-gray-900/30" />
            {/* Moonlight through cracks */}
            <div className="absolute top-0 left-1/3 w-1 h-full bg-blue-200/8 to-transparent blur-sm" />
            <div className="absolute top-0 right-1/4 w-0.5 h-full bg-blue-200/6 to-transparent blur-sm" />
          </>
        );
      default:
        return null;
    }
  };

  const imagePath = getBackgroundImage();

  // Test image loading
  useEffect(() => {
    const img = new Image();

    img.onload = () => {
      setImageLoaded(true);
      setImageError(false);
    };

    img.onerror = () => {
      setImageLoaded(false);
      setImageError(true);
    };

    img.src = imagePath;
  }, [imagePath]);

  return (
    <div className="absolute h-full w-full overflow-hidden">
      {/* Fallback gradient for missing images - only show if image fails to load */}
      <div
        className="absolute h-full w-full bg-gradient-to-br from-stone-900 via-amber-950 to-stone-900"
        style={{ zIndex: 1 }}
      />

      {/* Base image background */}
      <div
        className="absolute h-full w-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${imagePath})`,
          zIndex: 2,
        }}
      />
    </div>
  );
}
