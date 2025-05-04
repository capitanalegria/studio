
"use client"; // Add 'use client' because we're adding state with useState

import React, { useState } from 'react'; // Import useState
import LatentSpaceVisualizer from '@/components/latent-space-visualizer';
import RenderedImageView from '@/components/rendered-image-view';
import DataUploader from '@/components/data-uploader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle } from 'lucide-react';

export default function Home() {
  // State to track if the simulation of data loading is complete
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null);

  // Handler for when the DataUploader signals "data loaded" (simulated)
  const handleDataLoaded = (fileName: string) => {
     if (fileName) {
        setLoadedFileName(fileName);
        setIsDataLoaded(true);
        console.log(`Simulation complete for: ${fileName}. UI enabled.`);
        // In a real app: Fetch/process the actual data using the fileName/identifier
        // loadActualModelData(fileName);
     } else {
         // Handle case where data is unloaded (e.g., reset button)
         setLoadedFileName(null);
         setIsDataLoaded(false);
         console.log("Model data unloaded. UI disabled.");
     }
  };

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen p-4 gap-4">
      {/* Left Panel: Visualizer and Uploader */}
      <Card className="flex-1 flex flex-col overflow-hidden shadow-lg rounded-xl">
         <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-lg font-semibold">Latent Space Controls</CardTitle>
            {isDataLoaded && loadedFileName ? (
                 <CardDescription className="text-xs text-green-500 flex items-center pt-1">
                     <CheckCircle className="w-3 h-3 mr-1" />
                     {/* Clarify simulation */}
                     Model data loaded (Simulated): {loadedFileName}
                 </CardDescription>
            ) : (
                <CardDescription className="text-xs text-muted-foreground pt-1">
                    Load a model file to begin visualization.
                 </CardDescription>
            )}
         </CardHeader>
        <CardContent className="flex-1 flex flex-col p-2 md:p-4 gap-4 overflow-y-auto">
          {/* Visualizer takes available space */}
          <div className="flex-grow flex items-center justify-center min-h-[300px]">
             {/* Pass isDataLoaded to enable/disable interaction */}
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
      <Card className="flex-1 flex flex-col overflow-hidden shadow-lg rounded-xl">
         <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-lg font-semibold">Generated Output</CardTitle>
             {!isDataLoaded && (
                 <CardDescription className="text-xs text-muted-foreground pt-1">
                    {/* Update description */}
                    Waiting for model data to be loaded (simulation)...
                 </CardDescription>
            )}
            {isDataLoaded && (
                 <CardDescription className="text-xs text-muted-foreground pt-1">
                    {/* Update description */}
                    Rendering based on latent space coordinates (using placeholders).
                 </CardDescription>
            )}
         </CardHeader>
        <CardContent className="flex-1 p-2 md:p-4 flex items-center justify-center">
          {/* Pass isDataLoaded to enable/disable the view */}
          <RenderedImageView isEnabled={isDataLoaded} />
        </CardContent>
      </Card>
    </div>
  );
}
