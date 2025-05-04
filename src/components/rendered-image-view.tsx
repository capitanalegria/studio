"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Image as ImageIcon } from 'lucide-react';

interface ImageUpdateDetail {
    imageUrl: string | null;
    isLoading: boolean;
    error: string | null;
    coords: { x: number; y: number; z?: number } | null;
}


const RenderedImageView = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ x: number; y: number; z?: number } | null>(null);

  useEffect(() => {
    const handleImageUpdate = (event: Event) => {
       const customEvent = event as CustomEvent<ImageUpdateDetail>;
       const { imageUrl: newUrl, isLoading: loading, error: err, coords: newCoords } = customEvent.detail;
       setImageUrl(newUrl);
       setIsLoading(loading);
       setError(err);
       setCoords(newCoords);
    };

    window.addEventListener('latentImageUpdate', handleImageUpdate);

    return () => {
      window.removeEventListener('latentImageUpdate', handleImageUpdate);
    };
  }, []);


  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-secondary rounded-lg p-4">
       <div className="relative w-full aspect-square max-w-[400px] max-h-[400px] bg-muted rounded-md overflow-hidden flex items-center justify-center">
           {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                 <Skeleton className="h-[80%] w-[80%] rounded-md" />
                 <p className="text-sm text-muted-foreground">Rendering...</p>
             </div>
           )}
           {error && !isLoading && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-destructive text-center p-4">
                <AlertCircle className="w-12 h-12 mb-2" />
               <p className="font-semibold">Error Rendering Image</p>
               <p className="text-sm">{error}</p>
             </div>
           )}
           {!isLoading && !error && imageUrl && (
             <Image
               src={imageUrl}
               alt={`Latent space render at X:${coords?.x.toFixed(2)} Y:${coords?.y.toFixed(2)} ${coords?.z !== undefined ? `Z:${coords.z.toFixed(2)}` : ''}`}
               layout="fill"
               objectFit="contain" // Or "cover" depending on desired behavior
               unoptimized // Since it's a placeholder/dynamic URL
               data-ai-hint="abstract generated image"
             />
           )}
           {!isLoading && !error && !imageUrl && (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <ImageIcon className="w-16 h-16 mb-4" />
                    <p>Hover over the latent space to render an image.</p>
                </div>
           )}
       </div>
        {coords && !isLoading && !error && (
            <div className="mt-2 text-xs text-muted-foreground font-mono">
             Rendered for:
             X: {coords.x.toFixed(3)},
             Y: {coords.y.toFixed(3)}
             {coords.z !== undefined && `, Z: ${coords.z.toFixed(3)}`}
            </div>
        )}
    </div>
  );
};

export default RenderedImageView;
