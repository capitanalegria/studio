
"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Image as ImageIcon } from 'lucide-react';

interface ImageUpdateDetail {
    imageUrl: string | null;
    isLoading: boolean;
    error: string | null;
    coords: { x: number; y: number; z?: number } | null; // Coords can be null initially or on mouse leave
}


const RenderedImageView = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ x: number; y: number; z?: number } | null>(null);
  const [displayCoords, setDisplayCoords] = useState<{ x: number; y: number; z?: number } | null>(null); // Separate state for display

  useEffect(() => {
    const handleImageUpdate = (event: Event) => {
       const customEvent = event as CustomEvent<ImageUpdateDetail>;
       const { imageUrl: newUrl, isLoading: loading, error: err, coords: newCoords } = customEvent.detail;
       setImageUrl(newUrl);
       setIsLoading(loading);
       setError(err);
       setCoords(newCoords); // Store the actual coords used for generation/request

       // Update display coords only when not loading and there's an image or initial state
        if (!loading && (newUrl || (!newUrl && !err && !newCoords))) {
            setDisplayCoords(newCoords);
        } else if (loading){
            // Keep previous coords visible while loading new image
        } else if (err) {
             setDisplayCoords(newCoords); // Show coords even if there was an error for that point
        }

    };

    // Initialize with placeholder state
     handleImageUpdate(new CustomEvent('latentImageUpdate', {
         detail: { imageUrl: null, isLoading: false, error: null, coords: null }
     }));


    window.addEventListener('latentImageUpdate', handleImageUpdate);

    return () => {
      window.removeEventListener('latentImageUpdate', handleImageUpdate);
    };
  }, []);

   const getAltText = () => {
    if (!coords) return "Placeholder image";
    const zPart = coords.z !== undefined ? ` Z:${coords.z.toFixed(2)}` : '';
    return `Latent space render at X:${coords.x.toFixed(2)} Y:${coords.y.toFixed(2)}${zPart}`;
  };

    const getCoordString = (coordData: typeof displayCoords) => {
        if (!coordData) return null;
        const zPart = coordData.z !== undefined ? `, Z: ${coordData.z.toFixed(3)}` : '';
        return `X: ${coordData.x.toFixed(3)}, Y: ${coordData.y.toFixed(3)}${zPart}`;
    }


  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-secondary rounded-lg p-4">
       <div className="relative w-full aspect-square max-w-[400px] max-h-[400px] bg-muted rounded-md overflow-hidden flex items-center justify-center border border-border">
           {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10 bg-muted/80 backdrop-blur-sm">
                 <Skeleton className="h-[70%] w-[70%] rounded-md" />
                 <p className="text-sm text-muted-foreground animate-pulse">Rendering...</p>
             </div>
           )}
            {/* Image should be below the loading overlay initially */}
           {!error && imageUrl && (
             <Image
               key={imageUrl} // Add key to force re-render on URL change
               src={imageUrl}
               alt={getAltText()}
               fill // Use fill instead of layout
               sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px" // Provide sizes
               style={{ objectFit: 'contain' }} // Use style for objectFit
               unoptimized // Since it's a placeholder/dynamic URL
               data-ai-hint="abstract generated image"
               className="transition-opacity duration-300 ease-in-out"
                // Fade in effect can be handled here or with CSS if preferred
                // onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                // style={{ opacity: 0 }}
             />
           )}
           {error && !isLoading && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-destructive text-center p-4 z-10">
                <AlertCircle className="w-12 h-12 mb-2" />
               <p className="font-semibold">Error Rendering Image</p>
               <p className="text-sm">{error}</p>
             </div>
           )}
           {!isLoading && !error && !imageUrl && (
                <div className="flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                    <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                    <p>Interact with the latent space visualizer on the left to generate an image.</p>
                </div>
           )}
       </div>
        <div className="mt-2 text-xs text-muted-foreground font-mono h-4 text-center"> {/* Fixed height and center text */}
             { getCoordString(displayCoords) ? `Rendered for: ${getCoordString(displayCoords)}` : null }
        </div>
    </div>
  );
};

export default RenderedImageView;
