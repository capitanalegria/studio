
"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Image as ImageIcon, Lock } from 'lucide-react'; // Added Lock icon
import { cn } from '@/lib/utils'; // Import cn

interface ImageUpdateDetail {
    imageUrl: string | null;
    isLoading: boolean;
    error: string | null;
    coords: { x: number; y: number; z?: number } | null;
}

interface RenderedImageViewProps {
  isEnabled: boolean; // Prop to control enabled state
}


const RenderedImageView = ({ isEnabled }: RenderedImageViewProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ x: number; y: number; z?: number } | null>(null);
  const [displayCoords, setDisplayCoords] = useState<{ x: number; y: number; z?: number } | null>(null);

  useEffect(() => {
    const handleImageUpdate = (event: Event) => {
       // Only process updates if the component is enabled
       if (!isEnabled) {
            // Reset state if disabled after being enabled
            setImageUrl(null);
            setIsLoading(false);
            setError(null);
            setCoords(null);
            setDisplayCoords(null);
           return;
       }

       const customEvent = event as CustomEvent<ImageUpdateDetail>;
       const { imageUrl: newUrl, isLoading: loading, error: err, coords: newCoords } = customEvent.detail;
       setImageUrl(newUrl);
       setIsLoading(loading);
       setError(err);
       setCoords(newCoords);

        if (!loading && (newUrl || (!newUrl && !err && !newCoords))) {
            setDisplayCoords(newCoords);
        } else if (loading){
            // Keep previous coords visible while loading new image
        } else if (err) {
             setDisplayCoords(newCoords);
        }
    };

    // Initialize based on initial isEnabled state
     handleImageUpdate(new CustomEvent('latentImageUpdate', {
         detail: { imageUrl: null, isLoading: false, error: null, coords: null }
     }));


    window.addEventListener('latentImageUpdate', handleImageUpdate);

    // Add isEnabled to dependency array to re-run effect when it changes
    return () => {
      window.removeEventListener('latentImageUpdate', handleImageUpdate);
    };
  }, [isEnabled]); // Depend on isEnabled

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
           {/* Display Lock/Message when not enabled */}
            {!isEnabled && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20 bg-muted/80 backdrop-blur-sm text-center p-4">
                    <Lock className="w-12 h-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Load model data first</p>
                    <p className="text-xs text-muted-foreground">Then interact with the visualizer</p>
                </div>
            )}

           {/* Existing loading state (only shown if enabled) */}
           {isEnabled && isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10 bg-muted/80 backdrop-blur-sm">
                 <Skeleton className="h-[70%] w-[70%] rounded-md" />
                 <p className="text-sm text-muted-foreground animate-pulse">Rendering...</p>
             </div>
           )}

            {/* Image (only shown if enabled and not error) */}
           {isEnabled && !error && imageUrl && (
             <Image
               key={imageUrl}
               src={imageUrl}
               alt={getAltText()}
               fill
               sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
               style={{ objectFit: 'contain' }}
               unoptimized
               data-ai-hint="abstract generated image"
               className="transition-opacity duration-300 ease-in-out"
             />
           )}

           {/* Error state (only shown if enabled) */}
           {isEnabled && error && !isLoading && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-destructive text-center p-4 z-10">
                <AlertCircle className="w-12 h-12 mb-2" />
               <p className="font-semibold">Error Rendering Image</p>
               <p className="text-sm">{error}</p>
             </div>
           )}

           {/* Initial placeholder (only shown if enabled and no image/error/loading) */}
           {isEnabled && !isLoading && !error && !imageUrl && (
                <div className="flex flex-col items-center justify-center text-muted-foreground p-4 text-center z-0"> {/* Ensure z-index is lower than disabled overlay */}
                    <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                    <p>Interact with the latent space visualizer on the left to generate an image.</p>
                </div>
           )}
       </div>
        <div className="mt-2 text-xs text-muted-foreground font-mono h-4 text-center">
            {/* Only show coords if enabled and available */}
             { isEnabled && getCoordString(displayCoords) ? `Rendered for: ${getCoordString(displayCoords)}` : null }
        </div>
    </div>
  );
};

export default RenderedImageView;
