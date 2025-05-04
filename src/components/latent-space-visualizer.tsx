
"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw, Maximize, Minimize, Lock } from 'lucide-react'; // Added Lock
import Image from 'next/image';
import { getPlaceholderImage, ImageDimensions } from '@/services/image-rendering';
import * as THREE from 'three';
import { cn } from '@/lib/utils'; // Import cn utility

// --- 2D View ---
const LatentSpace2D = ({ setCoords, isEnabled }: { setCoords: (coords: { x: number; y: number }) => void, isEnabled: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [currentCoords, setCurrentCoords] = useState<{ x: number; y: number } | null>(null); // Local state for display


  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !isHovering || !isEnabled) return; // Check if enabled

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

    setCurrentCoords({ x, y }); // Update local state for display
    setCoords({ x, y }); // Update parent state for image generation
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
      if (!isEnabled) return; // Check if enabled
      event.preventDefault();
      const zoomFactor = 0.1;
      const newZoom = zoom * (1 - event.deltaY * zoomFactor * 0.1); // Adjust sensitivity
      setZoom(Math.max(0.1, Math.min(10, newZoom))); // Clamp zoom level
  };

   // Basic drag-to-pan functionality (optional)
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);
    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!isEnabled) return; // Check if enabled
        dragStartRef.current = { x: event.clientX, y: event.clientY };
    };
    const handleMouseUp = () => {
        dragStartRef.current = null;
    };
    const handleMouseLeave = () => {
        setIsHovering(false);
        dragStartRef.current = null; // Stop panning if mouse leaves
        setCurrentCoords(null); // Clear coords display when leaving
    };
     const handleDrag = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!dragStartRef.current || !containerRef.current || !isEnabled) return; // Check if enabled

        const dx = event.clientX - dragStartRef.current.x;
        const dy = event.clientY - dragStartRef.current.y;

        // Update offset based on drag distance, scaled by zoom
        setOffset(prev => ({
            x: prev.x - dx / (containerRef.current!.clientWidth ?? 500) / zoom,
            y: prev.y - dy / (containerRef.current!.clientHeight ?? 500) / zoom
        }));

        // Update drag start position for continuous dragging
        dragStartRef.current = { x: event.clientX, y: event.clientY };

        // Update coords while dragging
        handleMouseMove(event);
    };

  return (
    <div className="flex flex-col items-center w-full h-full">
        <div
            ref={containerRef}
            className={cn(
                "relative w-full h-full aspect-square max-w-[500px] max-h-[500px] bg-secondary rounded-lg overflow-hidden latent-space-bg",
                isEnabled ? "cursor-crosshair" : "cursor-not-allowed" // Change cursor based on isEnabled
            )}
            onMouseEnter={() => isEnabled && setIsHovering(true)} // Only set hover if enabled
            onMouseLeave={handleMouseLeave}
            onMouseMove={isHovering && isEnabled ? handleMouseMove : undefined} // Only handle if hovering and enabled
            onWheel={isEnabled ? handleWheel : undefined} // Only handle if enabled
            onMouseDown={isEnabled ? handleMouseDown : undefined} // Only handle if enabled
            onMouseUp={handleMouseUp} // Always handle mouse up to stop drag state
            onMouseMoveCapture={dragStartRef.current && isEnabled ? handleDrag : undefined} // Only drag if enabled
        >
           {/* Overlay when disabled */}
            {!isEnabled && (
                <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center z-10 rounded-lg backdrop-blur-sm">
                    <Lock className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Load model data to enable interaction</p>
                </div>
            )}
            {/* Placeholder for scaled distribution visualization */}
            <div
                className={cn(
                    "absolute inset-0 transition-transform duration-100 ease-out pointer-events-none", // Faster transition, disable pointer events
                    !isEnabled && "opacity-30" // Dim visualization when disabled
                )}
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
                 {/* Red Dot at the center (0,0) */}
                <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

                 {/* Coordinate Axes */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* X-axis */}
                    <div className="absolute left-0 right-0 top-1/2 h-px bg-muted-foreground/30 transform -translate-y-1/2"></div>
                    {/* Y-axis */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-muted-foreground/30 transform -translate-x-1/2"></div>
                </div>
            </div>

            {/* Zoom Controls */}
            <div className="absolute bottom-2 right-2 flex flex-col gap-1 z-20"> {/* Ensure controls are above disabled overlay */}
                <Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-accent" onClick={() => setZoom(z => Math.min(10, z * 1.2))} disabled={!isEnabled}>
                    <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-accent" onClick={() => setZoom(z => Math.max(0.1, z / 1.2))} disabled={!isEnabled}>
                    <ZoomOut className="h-4 w-4" />
                </Button>
                 <Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-accent" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }} disabled={!isEnabled}>
                    <Maximize className="h-4 w-4" /> {/* Reset zoom/pan */}
                </Button>
            </div>
        </div>
        {/* Display current coordinates */}
        <div className="mt-2 text-xs text-muted-foreground font-mono h-4"> {/* Fixed height */}
         {currentCoords && isEnabled && ( // Only show coords if enabled and available
             <>
             X: {currentCoords.x.toFixed(3)}, Y: {currentCoords.y.toFixed(3)}
             </>
         )}
        </div>
    </div>
  );
};


// --- 3D View ---
const LatentSpace3D = ({ setCoords, isEnabled }: { setCoords: (coords: { x: number; y: number; z: number }) => void, isEnabled: boolean }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cubeRef = useRef<THREE.Mesh | null>(null);
  const linesRef = useRef<THREE.LineSegments | null>(null); // Ref for lines
  const pointerRef = useRef<THREE.Mesh | null>(null); // For visualizing the intersection point
  const controlsRef = useRef<any>(null); // For OrbitControls or custom controls

  // State for 3D interaction (zoom, rotation, pointer position)
  const [zoom, setZoom] = useState(5); // Initial distance
  // We no longer need local React state for rotation as Three.js manages it internally
  // const [rotation, setRotation] = useState({ x: 0, y: 0 }); // REMOVED
  const [pointer3D, setPointer3D] = useState<{ x: number; y: number; z: number } | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ x: number; y: number; z: number } | null>(null); // Local state for display

    useEffect(() => {
        if (typeof window === 'undefined' || !mountRef.current) return;

        const currentMountRef = mountRef.current; // Capture ref value for cleanup
        let animationFrameId: number;

        // --- Scene Setup ---
        const scene = new THREE.Scene();
        sceneRef.current = scene;
        // Get computed background color
        const computedStyle = getComputedStyle(currentMountRef);
        const bgColor = computedStyle.backgroundColor || '#212121'; // Fallback
        scene.background = new THREE.Color(bgColor);


        // --- Camera ---
        const camera = new THREE.PerspectiveCamera(75, currentMountRef.clientWidth / currentMountRef.clientHeight, 0.1, 1000);
        // Apply the current zoom state to the initial camera position
        camera.position.z = zoom;
        cameraRef.current = camera;

        // --- Renderer ---
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // Enable alpha for potentially transparent bg
        renderer.setSize(currentMountRef.clientWidth, currentMountRef.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio); // Improve sharpness on high DPI screens
        currentMountRef.appendChild(renderer.domElement);
        rendererRef.current = renderer;


        // --- Cube ---
        const geometry = new THREE.BoxGeometry(2, 2, 2); // Represents -1 to 1 range
        const material = new THREE.MeshStandardMaterial({
            color: 0xcccccc, // Lighter gray cube
            transparent: true,
            opacity: 0.15, // More transparent
            metalness: 0.1,
            roughness: 0.7, // Slightly rougher
            side: THREE.DoubleSide, // Render inside faces too
        });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        cubeRef.current = cube;
        // Restore rotation state IS NOT NEEDED anymore as Three.js keeps it between renders if objects aren't destroyed


        // --- Edges ---
        const edges = new THREE.EdgesGeometry(geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x008080, linewidth: 1.5 }); // Teal edges, slightly thicker
        const lineSegments = new THREE.LineSegments(edges, lineMaterial);
        scene.add(lineSegments);
        linesRef.current = lineSegments; // Store ref for lines
        // Sync line rotation with cube's current rotation if cube exists
        if (cubeRef.current) {
            lineSegments.quaternion.copy(cubeRef.current.quaternion);
        }


        // --- Pointer Sphere ---
        const pointerGeo = new THREE.SphereGeometry(0.04, 16, 16); // Slightly smaller
        const pointerMat = new THREE.MeshBasicMaterial({ color: 0x00FFFF }); // Cyan pointer for better visibility
        const pointer = new THREE.Mesh(pointerGeo, pointerMat);
        pointer.visible = false; // Initially hidden
        scene.add(pointer);
        pointerRef.current = pointer;

        // --- Lights ---
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Brighter ambient
        scene.add(ambientLight);
        const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.6);
        dirLight1.position.set(5, 5, 5);
        scene.add(dirLight1);
        const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        dirLight2.position.set(-5, -5, -5);
        scene.add(dirLight2);


        // --- Interaction (Mouse Drag for Rotation) ---
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };

        const onMouseDown = (event: MouseEvent) => {
            if (!isEnabled) return; // Check if enabled
            isDragging = true;
            previousMousePosition = { x: event.clientX, y: event.clientY };
            currentMountRef.style.cursor = 'grabbing';
        };

        const onMouseMove = (event: MouseEvent) => {
            // Only rotate if dragging AND enabled
            if (!isDragging || !cubeRef.current || !linesRef.current || !isEnabled) return;

            const deltaMove = {
                x: event.clientX - previousMousePosition.x,
                y: event.clientY - previousMousePosition.y,
            };

            const rotateSpeed = 0.005;
             // Apply rotation relative to the current view
            const deltaRotationQuaternion = new THREE.Quaternion()
                .setFromEuler(new THREE.Euler(
                    deltaMove.y * rotateSpeed,
                    deltaMove.x * rotateSpeed,
                    0,
                    'XYZ' // Use 'XYZ' order
                ));

            // Apply the rotation delta to the current quaternion of both cube and lines
            cubeRef.current.quaternion.multiplyQuaternions(deltaRotationQuaternion, cubeRef.current.quaternion);
            linesRef.current.quaternion.copy(cubeRef.current.quaternion); // Sync line rotation

            // No need to update React state for rotation anymore
            // setRotation({ x: euler.x, y: euler.y }); // REMOVED

            previousMousePosition = { x: event.clientX, y: event.clientY };
        };

        const onMouseUp = () => {
            if (isDragging) {
                isDragging = false;
                currentMountRef.style.cursor = isEnabled ? 'grab' : 'not-allowed'; // Adjust cursor based on enabled state
            }
        };
         const onMouseLeave = () => {
             if (isDragging) {
                 isDragging = false;
                 currentMountRef.style.cursor = isEnabled ? 'grab' : 'not-allowed'; // Adjust cursor
             }
              if (pointerRef.current) pointerRef.current.visible = false;
             setCurrentCoords(null); // Clear coords display
         };

        // --- Interaction (Mouse Wheel for Zoom) ---
        const onWheel = (event: WheelEvent) => {
            if (!isEnabled || !cameraRef.current) return; // Check if enabled and camera exists
            event.preventDefault();
            const zoomSpeed = 0.1; // Reduced sensitivity
            const newZoom = Math.max(2, Math.min(15, cameraRef.current.position.z + event.deltaY * zoomSpeed)); // Adjusted min/max zoom
            setZoom(newZoom); // Update state (still useful for potential persistence or other logic)
            cameraRef.current.position.z = newZoom; // Update camera position directly
        };

         // --- Raycasting for Pointer ---
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const onPointerMove = (event: PointerEvent) => {
             // Only raycast if enabled and not dragging
             if (!currentMountRef || !cameraRef.current || !cubeRef.current || !pointerRef.current || isDragging || !isEnabled) {
                 if(pointerRef.current) pointerRef.current.visible = false;
                 setCurrentCoords(null); // Hide pointer and clear coords
                 return
             };

             const rect = currentMountRef.getBoundingClientRect();
             // Calculate mouse position in normalized device coordinates (-1 to +1)
             mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
             mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

             // Update the picking ray with the camera and mouse position
             raycaster.setFromCamera(mouse, cameraRef.current);

             // Calculate objects intersecting the picking ray
             // Important: Raycast against the CUBE MESH, not the lines
             const intersects = raycaster.intersectObject(cubeRef.current);

             if (intersects.length > 0) {
                 // Get the intersection point in world space
                 const worldIntersectionPoint = intersects[0].point;

                 // Transform the world intersection point to the cube's local space
                 // This accounts for the cube's rotation
                 const localIntersectionPoint = cubeRef.current.worldToLocal(worldIntersectionPoint.clone());


                 // The cube's geometry origin is (0,0,0), and it has size 2x2x2 centered at origin.
                 // So, the local coordinates directly correspond to the -1 to 1 range.
                 const coordsInCube = {
                     x: Math.max(-1, Math.min(1, localIntersectionPoint.x)),
                     y: Math.max(-1, Math.min(1, localIntersectionPoint.y)),
                     z: Math.max(-1, Math.min(1, localIntersectionPoint.z)),
                 };

                 setCurrentCoords(coordsInCube); // Update local state for display
                 setCoords(coordsInCube); // Update parent state for image generation

                 // Position the pointer sphere at the world intersection point
                 pointerRef.current.position.copy(worldIntersectionPoint);
                 pointerRef.current.visible = true;
             } else {
                  setCurrentCoords(null); // Clear local coords display
                 // Optionally reset coords in parent or keep the last valid ones
                 // setCoords({x: 0, y: 0, z: 0}); // Example: Reset to center
                 if (pointerRef.current) pointerRef.current.visible = false;
             }
        };


        // --- Animation Loop ---
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            // NO automatic rotation here anymore
            // if (cubeRef.current && linesRef.current && !isDragging) {
            //     // Subtle rotation only when not dragging
            //     cubeRef.current.rotation.y += 0.001;
            //     linesRef.current.rotation.y = cubeRef.current.rotation.y;
            // }

             if (rendererRef.current && sceneRef.current && cameraRef.current) {
                rendererRef.current.render(sceneRef.current, cameraRef.current);
             }
        };
        animate();

        // --- Event Listeners ---
        currentMountRef.addEventListener('mousedown', onMouseDown);
        currentMountRef.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp); // Listen on window to catch mouseup outside element
        currentMountRef.addEventListener('mouseleave', onMouseLeave);
        currentMountRef.addEventListener('wheel', onWheel, { passive: false }); // Explicitly not passive
        currentMountRef.addEventListener('pointermove', onPointerMove);


        // --- Resize Handling ---
        const handleResize = () => {
            if (!rendererRef.current || !cameraRef.current || !currentMountRef) return;
            const width = currentMountRef.clientWidth;
            const height = currentMountRef.clientHeight;
            rendererRef.current.setSize(width, height);
            cameraRef.current.aspect = width / height;
            cameraRef.current.updateProjectionMatrix();
        };
        window.addEventListener('resize', handleResize);
        // Initial resize call
        handleResize();

        // --- Cleanup ---
        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mouseup', onMouseUp); // Clean up window listener
            if (currentMountRef) {
                 currentMountRef.removeEventListener('mousedown', onMouseDown);
                currentMountRef.removeEventListener('mousemove', onMouseMove);
                // currentMountRef.removeEventListener('mouseup', onMouseUp); // Removed as it's on window now
                currentMountRef.removeEventListener('mouseleave', onMouseLeave);
                currentMountRef.removeEventListener('wheel', onWheel);
                currentMountRef.removeEventListener('pointermove', onPointerMove);


                // Remove renderer canvas
                 if (rendererRef.current?.domElement) {
                    try {
                         currentMountRef.removeChild(rendererRef.current.domElement);
                    } catch (e) {
                         console.warn("Could not remove canvas during cleanup:", e);
                    }
                 }
            }
             // Dispose Three.js objects
             if (rendererRef.current) {
                rendererRef.current.dispose();
                rendererRef.current = null;
            }
             if (sceneRef.current) {
                // Dispose geometries, materials, textures in the scene
                 sceneRef.current.traverse((object) => {
                    if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
                        if (object.geometry) object.geometry.dispose();
                         if (object.material) {
                             const materials = Array.isArray(object.material) ? object.material : [object.material];
                             materials.forEach(material => material.dispose());
                         }
                    }
                 });
                sceneRef.current = null;
            }
            cameraRef.current = null;
            cubeRef.current = null;
            linesRef.current = null; // Clean up lines ref
            pointerRef.current = null;
        };
    // Removed `rotation` from dependencies. Only depend on `zoom` (for initial setting) and `isEnabled`.
    }, [zoom, isEnabled]);


   const resetView = () => {
        if (!isEnabled) return; // Only allow reset if enabled
        setZoom(5);
        // No need to reset local React rotation state anymore

        // Reset Three.js object rotations and camera position directly
         if (cubeRef.current) {
             cubeRef.current.rotation.set(0, 0, 0);
             cubeRef.current.quaternion.set(0, 0, 0, 1); // Reset quaternion
         }
         if (linesRef.current) { // Reset lines rotation
             linesRef.current.rotation.set(0, 0, 0);
             linesRef.current.quaternion.set(0, 0, 0, 1);
         }

        if (cameraRef.current) {
            cameraRef.current.position.set(0, 0, 5); // Reset position to initial zoom state
            cameraRef.current.lookAt(0, 0, 0); // Ensure it looks at the center
            cameraRef.current.updateProjectionMatrix();
        }
         // Force re-render (might not be strictly necessary but ensures update)
         if (rendererRef.current && sceneRef.current && cameraRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
    };

  return (
    <div className="flex flex-col items-center w-full h-full">
        <div className={cn(
            "relative w-full h-full aspect-square max-w-[500px] max-h-[500px] rounded-lg overflow-hidden bg-secondary",
            isEnabled ? 'cursor-grab' : 'cursor-not-allowed' // Dynamic cursor
        )}>
            <div ref={mountRef} className={cn("w-full h-full", !isEnabled && "opacity-50")} />
             {/* Overlay when disabled */}
            {!isEnabled && (
                <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center z-10 rounded-lg backdrop-blur-sm">
                    <Lock className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Load model data to enable interaction</p>
                </div>
            )}
            {/* Reset View Button */}
            <div className="absolute bottom-2 right-2 flex flex-col gap-1 z-20"> {/* Ensure controls are above disabled overlay */}
                <Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-accent" onClick={resetView} title="Reset View" disabled={!isEnabled}>
                    <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-accent" onClick={() => setZoom(z => Math.min(15, z + 1))} title="Zoom Out" disabled={!isEnabled}>
                    <ZoomOut className="h-4 w-4" /> {/* Zoom out = Increase distance */}
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-accent" onClick={() => setZoom(z => Math.max(2, z - 1))} title="Zoom In" disabled={!isEnabled}>
                    <ZoomIn className="h-4 w-4" /> {/* Zoom in = Decrease distance */}
                </Button>
            </div>
        </div>
        {/* Display current coordinates */}
        <div className="mt-2 text-xs text-muted-foreground font-mono h-4"> {/* Fixed height */}
         {currentCoords && isEnabled && ( // Only show coords if enabled and available
                <>
                 X: {currentCoords.x.toFixed(3)},
                 Y: {currentCoords.y.toFixed(3)},
                 Z: {currentCoords.z.toFixed(3)}
                </>
         )}
        </div>
    </div>
 );
};


// --- Main Visualizer Component ---
const LatentSpaceVisualizer = ({ isEnabled }: { isEnabled: boolean }) => { // Receive isEnabled prop
  const [coords, setCoords] = useState<{ x: number; y: number; z?: number } | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageDimensions: ImageDimensions = { width: 300, height: 300 }; // Desired output size

  const handleSetCoords = (newCoords: { x: number; y: number; z?: number }) => {
     if (!isEnabled) return; // Prevent setting coords if not enabled
     setCoords(newCoords);
  }

  // Debounce fetching image to avoid excessive API calls
  useEffect(() => {
     // Only fetch if enabled and coords are set
    if (!isEnabled || !coords) {
         // Clear the image display immediately if not enabled or no coords
         const event = new CustomEvent('latentImageUpdate', { detail: { imageUrl: null, isLoading: false, error: null, coords: null } });
         window.dispatchEvent(event);
         setImageUrl(null);
         setIsLoading(false);
         setError(null);
        return;
    }

    setIsLoading(true);
    setError(null);
    // Dispatch loading state immediately
    const loadingEvent = new CustomEvent('latentImageUpdate', { detail: { imageUrl, isLoading: true, error: null, coords } });
    window.dispatchEvent(loadingEvent);


    const timer = setTimeout(async () => {
      try {
        // Use all available coordinates for the seed
        const x = coords.x;
        const y = coords.y;
        const z = coords.z; // Use z if available
        // TODO: Replace with actual image generation based on loaded .pkl data and coords
        // const generatedImage = await generateImageFromModel(loadedPklData, x, y, z);
        // For now, we continue using the placeholder service.
        const url = await getPlaceholderImage(x, y, z, imageDimensions);
        setImageUrl(url);
         // Dispatch success state
         const successEvent = new CustomEvent('latentImageUpdate', { detail: { imageUrl: url, isLoading: false, error: null, coords } });
         window.dispatchEvent(successEvent);
      } catch (err) {
        console.error("Error fetching/generating image:", err);
        const errorMsg = err instanceof Error ? err.message : "Failed to load image.";
        setError(errorMsg);
        setImageUrl(null); // Clear image on error
        // Dispatch error state
        const errorEvent = new CustomEvent('latentImageUpdate', { detail: { imageUrl: null, isLoading: false, error: errorMsg, coords } });
        window.dispatchEvent(errorEvent);
      } finally {
        setIsLoading(false); // Ensure loading is set to false
      }
    }, 150); // Slightly longer debounce for smoother experience with potentially slower generation

    return () => clearTimeout(timer);
     // Depend on isEnabled and coords
  }, [coords, isEnabled, imageUrl]); // Added imageUrl to deps based on eslint hint, review if necessary

  // Removed the second useEffect that dispatches events, as it's now handled within the first useEffect.


  return (
    <Tabs defaultValue="2d" className="w-full h-full flex flex-col items-center">
      <TabsList className="mb-4">
        <TabsTrigger value="2d" disabled={!isEnabled}>2D View</TabsTrigger> {/* Disable tabs if not enabled */}
        <TabsTrigger value="3d" disabled={!isEnabled}>3D View</TabsTrigger> {/* Disable tabs if not enabled */}
      </TabsList>
      <TabsContent value="2d" className="w-full flex-1 flex justify-center items-start p-0"> {/* Align items start */}
        <LatentSpace2D setCoords={(c) => handleSetCoords({ x: c.x, y: c.y, z: coords?.z })} isEnabled={isEnabled} />
      </TabsContent>
      <TabsContent value="3d" className="w-full flex-1 flex justify-center items-start p-0"> {/* Align items start */}
         <Suspense fallback={<div className="text-center p-10">Loading 3D View...</div>}>
             <LatentSpace3D setCoords={handleSetCoords} isEnabled={isEnabled} />
         </Suspense>
      </TabsContent>
       {/* Coords display is now inside 2D/3D components */}
    </Tabs>
  );
};

export default LatentSpaceVisualizer;
