"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw, Maximize, Minimize } from 'lucide-react';
import Image from 'next/image';
import { getPlaceholderImage, ImageDimensions } from '@/services/image-rendering';
import * as THREE from 'three';

// --- 2D View ---
const LatentSpace2D = ({ setCoords }: { setCoords: (coords: { x: number; y: number }) => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !isHovering) return;

    const rect = containerRef.current.getBoundingClientRect();
    const containerSize = Math.min(rect.width, rect.height); // Use smallest dimension for square aspect ratio

    // Calculate mouse position relative to the container center
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Apply zoom and offset to map mouse coords to latent space coords (-1 to 1)
    // Center coordinates before applying zoom/offset
    const centeredX = (mouseX - rect.width / 2);
    const centeredY = (mouseY - rect.height / 2);

    // Apply zoom and offset
    const zoomedX = (centeredX / (containerSize / 2) / zoom) - offset.x;
    const zoomedY = (centeredY / (containerSize / 2) / zoom) - offset.y;


    // Clamp coordinates between -1 and 1
    const x = Math.max(-1, Math.min(1, zoomedX));
    const y = Math.max(-1, Math.min(1, zoomedY)); // Invert Y if needed based on visualization convention

    setCoords({ x, y });
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      const zoomFactor = 0.1;
      const newZoom = zoom * (1 - event.deltaY * zoomFactor * 0.1); // Adjust sensitivity
      setZoom(Math.max(0.1, Math.min(10, newZoom))); // Clamp zoom level
  };

   // Basic drag-to-pan functionality (optional)
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);
    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        dragStartRef.current = { x: event.clientX, y: event.clientY };
    };
    const handleMouseUp = () => {
        dragStartRef.current = null;
    };
    const handleMouseLeave = () => {
        setIsHovering(false);
        dragStartRef.current = null; // Stop panning if mouse leaves
    };
     const handleDrag = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!dragStartRef.current) return;

        const dx = event.clientX - dragStartRef.current.x;
        const dy = event.clientY - dragStartRef.current.y;

        // Update offset based on drag distance, scaled by zoom
        setOffset(prev => ({
            x: prev.x - dx / (containerRef.current?.clientWidth ?? 500) / zoom,
            y: prev.y - dy / (containerRef.current?.clientHeight ?? 500) / zoom
        }));

        // Update drag start position for continuous dragging
        dragStartRef.current = { x: event.clientX, y: event.clientY };
    };

  return (
    <div
        ref={containerRef}
        className="relative w-full h-full aspect-square max-w-[500px] max-h-[500px] bg-secondary rounded-lg overflow-hidden cursor-crosshair latent-space-bg"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={handleMouseLeave}
        onMouseMove={isHovering ? handleMouseMove : undefined}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMoveCapture={dragStartRef.current ? handleDrag : undefined} // Use capture phase for dragging
    >
        {/* Placeholder for scaled distribution visualization */}
        <div
            className="absolute inset-0 transition-transform duration-200 ease-out"
             style={{
                 transform: `scale(${zoom}) translate(${offset.x * 50}%, ${offset.y * 50}%)`, // Adjust translation based on offset and zoom
                 transformOrigin: 'center center', // Zoom from the center
             }}
        >
           {/* Add visual elements for the distribution here if needed */}
           {/* Example: A grid or points */}
           <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 opacity-10">
                {[...Array(100)].map((_, i) => (
                    <div key={i} className="border border-muted-foreground/50"></div>
                ))}
            </div>
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-2 right-2 flex flex-col gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-accent" onClick={() => setZoom(z => Math.min(10, z * 1.2))}>
                <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-accent" onClick={() => setZoom(z => Math.max(0.1, z / 1.2))}>
                <ZoomOut className="h-4 w-4" />
            </Button>
             <Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-accent" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}>
                <Maximize className="h-4 w-4" /> {/* Reset zoom/pan */}
            </Button>
        </div>
    </div>
  );
};


// --- 3D View ---
const LatentSpace3D = ({ setCoords }: { setCoords: (coords: { x: number; y: number; z: number }) => void }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cubeRef = useRef<THREE.Mesh | null>(null);
  const pointerRef = useRef<THREE.Mesh | null>(null); // For visualizing the intersection point
  const controlsRef = useRef<any>(null); // For OrbitControls or custom controls

  // State for 3D interaction (zoom, rotation, pointer position)
  const [zoom, setZoom] = useState(5); // Initial distance
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [pointer3D, setPointer3D] = useState<{ x: number; y: number; z: number } | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined' || !mountRef.current) return;

        // --- Scene Setup ---
        const scene = new THREE.Scene();
        sceneRef.current = scene;
        scene.background = new THREE.Color(0x212121); // Match background color

        // --- Camera ---
        const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
        camera.position.z = zoom;
        cameraRef.current = camera;

        // --- Renderer ---
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        mountRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // --- Cube ---
        const geometry = new THREE.BoxGeometry(2, 2, 2); // Represents -1 to 1 range
        const material = new THREE.MeshStandardMaterial({
            color: 0xdddddd, // Light gray cube
            transparent: true,
            opacity: 0.3,
            metalness: 0.1,
            roughness: 0.6,
        });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        cubeRef.current = cube;

        // --- Edges ---
        const edges = new THREE.EdgesGeometry(geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x008080 }); // Teal edges
        const lineSegments = new THREE.LineSegments(edges, lineMaterial);
        scene.add(lineSegments);


        // --- Pointer Sphere ---
        const pointerGeo = new THREE.SphereGeometry(0.05, 16, 16);
        const pointerMat = new THREE.MeshBasicMaterial({ color: 0x008080 }); // Teal pointer
        const pointer = new THREE.Mesh(pointerGeo, pointerMat);
        pointer.visible = false; // Initially hidden
        scene.add(pointer);
        pointerRef.current = pointer;

        // --- Lights ---
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0xffffff, 0.8);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);
         const pointLight2 = new THREE.PointLight(0xffffff, 0.5);
        pointLight2.position.set(-5, -5, -5);
        scene.add(pointLight2);

        // --- Interaction (Mouse Drag for Rotation) ---
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };

        const onMouseDown = (event: MouseEvent) => {
            isDragging = true;
            previousMousePosition = { x: event.clientX, y: event.clientY };
        };

        const onMouseMove = (event: MouseEvent) => {
            if (!isDragging || !cubeRef.current || !lineSegments) return;

            const deltaMove = {
                x: event.clientX - previousMousePosition.x,
                y: event.clientY - previousMousePosition.y,
            };

            const rotateSpeed = 0.005;
            const newRotationY = rotation.y + deltaMove.x * rotateSpeed;
            const newRotationX = rotation.x + deltaMove.y * rotateSpeed;

             setRotation({ x: newRotationX, y: newRotationY });

            cubeRef.current.rotation.y = newRotationY;
            cubeRef.current.rotation.x = newRotationX;
            lineSegments.rotation.copy(cubeRef.current.rotation); // Sync line rotation

            previousMousePosition = { x: event.clientX, y: event.clientY };
        };

        const onMouseUp = () => {
            isDragging = false;
        };

        // --- Interaction (Mouse Wheel for Zoom) ---
        const onWheel = (event: WheelEvent) => {
            event.preventDefault();
            const zoomSpeed = 0.5;
            const newZoom = Math.max(1, Math.min(20, zoom + event.deltaY * zoomSpeed * 0.1)); // Clamp zoom
            setZoom(newZoom);
            camera.position.z = newZoom;
        };

         // --- Raycasting for Pointer ---
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const onPointerMove = (event: PointerEvent) => {
             if (!mountRef.current || !camera || !cubeRef.current || !pointerRef.current) return;

             const rect = mountRef.current.getBoundingClientRect();
             // Calculate mouse position in normalized device coordinates (-1 to +1)
             mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
             mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

             // Update the picking ray with the camera and mouse position
             raycaster.setFromCamera(mouse, camera);

             // Calculate objects intersecting the picking ray
             const intersects = raycaster.intersectObject(cubeRef.current);

             if (intersects.length > 0) {
                 const intersectionPoint = intersects[0].point;
                 // The cube's origin is (0,0,0), and it has size 2x2x2
                 // So, the coordinates within the cube range from -1 to 1
                 const coordsInCube = {
                     x: Math.max(-1, Math.min(1, intersectionPoint.x)),
                     y: Math.max(-1, Math.min(1, intersectionPoint.y)),
                     z: Math.max(-1, Math.min(1, intersectionPoint.z)),
                 };
                 setPointer3D(coordsInCube);
                 setCoords(coordsInCube); // Update parent state
                 pointerRef.current.position.copy(intersectionPoint);
                 pointerRef.current.visible = true;
             } else {
                  setPointer3D(null);
                 // Optionally reset coords or keep the last valid ones
                 // setCoords({x: 0, y: 0, z: 0}); // Example: Reset to center
                 if (pointerRef.current) pointerRef.current.visible = false;
             }
        };

         const onPointerLeave = () => {
             if (pointerRef.current) pointerRef.current.visible = false;
             setPointer3D(null);
             // Optionally reset coords
         }


        // --- Animation Loop ---
        const animate = () => {
            requestAnimationFrame(animate);
            // Add any continuous animations here (e.g., slight auto-rotation)
            renderer.render(scene, camera);
        };
        animate();

        // --- Event Listeners ---
        const currentMountRef = mountRef.current; // Capture ref value
        currentMountRef.addEventListener('mousedown', onMouseDown);
        currentMountRef.addEventListener('mousemove', onMouseMove);
        currentMountRef.addEventListener('mouseup', onMouseUp);
        currentMountRef.addEventListener('mouseleave', onMouseUp); // Stop dragging if mouse leaves
        currentMountRef.addEventListener('wheel', onWheel);
        currentMountRef.addEventListener('pointermove', onPointerMove);
        currentMountRef.addEventListener('pointerleave', onPointerLeave);


        // --- Resize Handling ---
        const handleResize = () => {
            if (!renderer || !camera || !currentMountRef) return;
            const width = currentMountRef.clientWidth;
            const height = currentMountRef.clientHeight;
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        };
        window.addEventListener('resize', handleResize);

        // --- Cleanup ---
        return () => {
            window.removeEventListener('resize', handleResize);
            if (currentMountRef) {
                 currentMountRef.removeEventListener('mousedown', onMouseDown);
                currentMountRef.removeEventListener('mousemove', onMouseMove);
                currentMountRef.removeEventListener('mouseup', onMouseUp);
                currentMountRef.removeEventListener('mouseleave', onMouseUp);
                currentMountRef.removeEventListener('wheel', onWheel);
                currentMountRef.removeEventListener('pointermove', onPointerMove);
                currentMountRef.removeEventListener('pointerleave', onPointerLeave);

                // Remove renderer canvas
                 while (currentMountRef.firstChild) {
                     currentMountRef.removeChild(currentMountRef.firstChild);
                 }
            }
             if (rendererRef.current) {
                rendererRef.current.dispose();
                rendererRef.current = null;
            }
            sceneRef.current = null;
            cameraRef.current = null;
            cubeRef.current = null;
            pointerRef.current = null;
        };
    }, [zoom]); // Re-run effect if zoom changes to update camera position initially

   const resetView = () => {
        setZoom(5);
        setRotation({ x: 0, y: 0 });
        if (cubeRef.current) {
            cubeRef.current.rotation.set(0, 0, 0);
             // Find the line segments and reset its rotation too
            const lineSegments = sceneRef.current?.children.find(child => child instanceof THREE.LineSegments);
            if (lineSegments instanceof THREE.LineSegments) {
                lineSegments.rotation.set(0, 0, 0);
            }
        }
        if (cameraRef.current) {
            cameraRef.current.position.z = 5;
        }
    };

  return (
     <div className="relative w-full h-full aspect-square max-w-[500px] max-h-[500px] rounded-lg overflow-hidden cursor-grab active:cursor-grabbing">
         <div ref={mountRef} className="w-full h-full" />
         {/* Placeholder for Leap Motion status/controls */}
         <div className="absolute top-2 left-2 bg-background/80 text-foreground text-xs px-2 py-1 rounded">
             Leap Motion: Disconnected (Placeholder)
         </div>
          {/* Reset View Button */}
         <div className="absolute bottom-2 right-2 flex flex-col gap-1">
             <Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-accent" onClick={resetView}>
                <RotateCcw className="h-4 w-4" />
             </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-accent" onClick={() => setZoom(z => Math.min(20, z + 1))}>
                <ZoomOut className="h-4 w-4" /> {/* Zoom out = Increase distance */}
            </Button>
             <Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-accent" onClick={() => setZoom(z => Math.max(1, z - 1))}>
                <ZoomIn className="h-4 w-4" /> {/* Zoom in = Decrease distance */}
            </Button>
         </div>
     </div>
 );
};


// --- Main Visualizer Component ---
const LatentSpaceVisualizer = () => {
  const [coords, setCoords] = useState<{ x: number; y: number; z?: number } | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageDimensions: ImageDimensions = { width: 300, height: 300 }; // Desired output size

  // Debounce fetching image to avoid excessive API calls
  useEffect(() => {
    if (!coords) return;

    setIsLoading(true);
    setError(null);
    const timer = setTimeout(async () => {
      try {
        // For 3D, we might only use x and y for the placeholder image service
        const x = coords.x;
        const y = coords.y;
        const url = await getPlaceholderImage(x, y, imageDimensions);
        setImageUrl(url);
      } catch (err) {
        console.error("Error fetching placeholder image:", err);
        setError("Failed to load image.");
        setImageUrl(null); // Clear image on error
      } finally {
        setIsLoading(false);
      }
    }, 100); // Debounce time in ms

    return () => clearTimeout(timer);
  }, [coords]); // Re-run effect when coords change

  // Send image URL to the RenderedImageView component (using custom event or state management)
   useEffect(() => {
    if (imageUrl) {
      const event = new CustomEvent('latentImageUpdate', { detail: { imageUrl, isLoading, error, coords } });
      window.dispatchEvent(event);
    } else if(isLoading || error || !coords){
         const event = new CustomEvent('latentImageUpdate', { detail: { imageUrl: null, isLoading, error, coords } });
         window.dispatchEvent(event);
    }
  }, [imageUrl, isLoading, error, coords]);


  return (
    <Tabs defaultValue="2d" className="w-full h-full flex flex-col items-center">
      <TabsList className="mb-4">
        <TabsTrigger value="2d">2D View</TabsTrigger>
        <TabsTrigger value="3d">3D View</TabsTrigger>
      </TabsList>
      <TabsContent value="2d" className="w-full flex-1 flex justify-center items-center p-0">
        <LatentSpace2D setCoords={(c) => setCoords({ x: c.x, y: c.y })} />
      </TabsContent>
      <TabsContent value="3d" className="w-full flex-1 flex justify-center items-center p-0">
         <Suspense fallback={<div className="text-center">Loading 3D View...</div>}>
             <LatentSpace3D setCoords={(c) => setCoords(c)} />
         </Suspense>
      </TabsContent>
       {/* Display current coordinates */}
        {coords && (
            <div className="mt-2 text-xs text-muted-foreground font-mono">
             Coords:
             X: {coords.x.toFixed(3)},
             Y: {coords.y.toFixed(3)}
             {coords.z !== undefined && `, Z: ${coords.z.toFixed(3)}`}
            </div>
        )}
    </Tabs>
  );
};

export default LatentSpaceVisualizer;
