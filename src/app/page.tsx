import LatentSpaceVisualizer from '@/components/latent-space-visualizer';
import RenderedImageView from '@/components/rendered-image-view';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="flex flex-col md:flex-row w-full h-screen p-4 gap-4">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 p-2 md:p-4 flex items-center justify-center">
          <LatentSpaceVisualizer />
        </CardContent>
      </Card>
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 p-2 md:p-4 flex items-center justify-center">
          <RenderedImageView />
        </CardContent>
      </Card>
    </div>
  );
}
