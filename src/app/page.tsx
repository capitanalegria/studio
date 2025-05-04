import LatentSpaceVisualizer from '@/components/latent-space-visualizer';
import RenderedImageView from '@/components/rendered-image-view';
import DataUploader from '@/components/data-uploader'; // Import the new component
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  return (
    <div className="flex flex-col md:flex-row w-full h-screen p-4 gap-4">
      {/* Left Panel: Visualizer and Uploader */}
      <Card className="flex-1 flex flex-col overflow-hidden">
         <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-lg">Latent Space Controls</CardTitle>
         </CardHeader>
        <CardContent className="flex-1 flex flex-col p-2 md:p-4 gap-4 overflow-y-auto">
          {/* Visualizer takes available space */}
          <div className="flex-grow flex items-center justify-center min-h-[300px]">
             <LatentSpaceVisualizer />
          </div>
           <Separator className="my-2" />
          {/* Uploader stays at the bottom */}
          <div className="flex-shrink-0">
             <DataUploader />
          </div>
        </CardContent>
      </Card>

      {/* Right Panel: Rendered Image */}
      <Card className="flex-1 flex flex-col overflow-hidden">
         <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-lg">Generated Output</CardTitle>
         </CardHeader>
        <CardContent className="flex-1 p-2 md:p-4 flex items-center justify-center">
          <RenderedImageView />
        </CardContent>
      </Card>
    </div>
  );
}
