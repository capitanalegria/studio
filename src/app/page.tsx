
"use client"; // Add 'use client' because we're adding state with useState

import React, { useState } from 'react'; // Import useState
import LatentSpaceVisualizer from '@/components/latent-space-visualizer';
import RenderedImageView from '@/components/rendered-image-view';
import DataUploader from '@/components/data-uploader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle } from 'lucide-react';

export default function Home() {
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null);

  const handleDataLoaded = (fileName: string) => {
    setLoadedFileName(fileName);
    setIsDataLoaded(true);
    // You can trigger further actions here now that data is "loaded"
    console.log(`Data loaded from: ${fileName}. Ready for use.`);
  };

  return (
    <div className="flex flex-col md:flex-row w-full h-screen p-4 gap-4">
      {/* Left Panel: Visualizer and Uploader */}
      <Card className="flex-1 flex flex-col overflow-hidden">
         <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-lg">Latent Space Controls</CardTitle>
            {isDataLoaded && loadedFileName && (
                 <CardDescription className="text-xs text-green-500 flex items-center pt-1">
                     <CheckCircle className="w-3 h-3 mr-1" />
                     Model data loaded: {loadedFileName}
                 </CardDescription>
            )}
         </CardHeader>
        <CardContent className="flex-1 flex flex-col p-2 md:p-4 gap-4 overflow-y-auto">
          {/* Visualizer takes available space */}
          <div className="flex-grow flex items-center justify-center min-h-[300px]">
             {/* Pass isDataLoaded if the visualizer needs to behave differently based on load status */}
             <LatentSpaceVisualizer isEnabled={isDataLoaded} />
          </div>
           <Separator className="my-2" />
          {/* Uploader stays at the bottom */}
          <div className="flex-shrink-0">
             {/* Pass the handler function to the uploader */}
             <DataUploader onDataLoaded={handleDataLoaded} />
          </div>
        </CardContent>
      </Card>

      {/* Right Panel: Rendered Image */}
      <Card className="flex-1 flex flex-col overflow-hidden">
         <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-lg">Generated Output</CardTitle>
             {!isDataLoaded && (
                 <CardDescription className="text-xs text-muted-foreground pt-1">
                    Waiting for model data to be loaded...
                 </CardDescription>
            )}
         </CardHeader>
        <CardContent className="flex-1 p-2 md:p-4 flex items-center justify-center">
          {/* Pass isDataLoaded if the view needs to behave differently */}
          <RenderedImageView isEnabled={isDataLoaded} />
        </CardContent>
      </Card>
    </div>
  );
}
