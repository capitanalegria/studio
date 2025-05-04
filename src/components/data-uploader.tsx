
"use client";

import React, { useState, ChangeEvent, useTransition } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Link as LinkIcon, Loader2, CheckCircle, AlertTriangle, RefreshCcw } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

type UploadStatus = 'idle' | 'loading' | 'success' | 'error';

interface DataUploaderProps {
  onDataLoaded: (fileName: string) => void; // Callback when data is "loaded"
}

/**
 * Placeholder function to simulate file upload and processing.
 * In a real application, this would involve sending the file/link to a server endpoint
 * for actual parsing and validation of the .pkl file.
 * Parsing .pkl files in JS/TS is complex and often requires a backend (e.g., Python).
 *
 * @param duration The simulated duration of the upload/processing in milliseconds.
 * @param fileName The name of the file being "processed".
 * @returns A promise that resolves when the simulation is complete.
 */
const simulateUploadAndProcess = (duration: number, fileName: string): Promise<void> => {
    console.warn(`Simulating load/process for: ${fileName}. Duration: ${duration}ms. Actual .pkl parsing is NOT implemented.`);
    return new Promise<void>((resolve, reject) => {
        let currentProgress = 0;
        const intervalTime = Math.max(10, duration / 100); // Ensure intervalTime is at least 10ms

        const interval = setInterval(() => {
            currentProgress += 1;
            // Update progress state via external function if needed, or manage internally
            // setProgress(currentProgress); // Assuming setProgress is accessible here or passed in

            if (currentProgress >= 100) {
                clearInterval(interval);
                // Simulate some final processing time after "upload" completes
                setTimeout(() => {
                    console.log(`Simulated processing complete for: ${fileName}`);
                    // NOTE: Replace with actual .pkl file processing logic result handling if implemented.
                    resolve();
                }, 300); // Simulate 300ms final processing
            }
        }, intervalTime);

        // Optional: Simulate potential errors during upload/processing
        // setTimeout(() => {
        //   clearInterval(interval);
        //   reject(new Error(`Simulated failure processing ${fileName}`));
        // }, duration * 0.7); // Example: Fail 70% of the way through
    });
};


const DataUploader: React.FC<DataUploaderProps> = ({ onDataLoaded }) => {
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [driveLink, setDriveLink] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('local');
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null); // Store loaded file name
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const resetState = () => {
    setLocalFile(null);
    setDriveLink('');
    setUploadStatus('idle');
    setUploadMessage(null);
    setProgress(0);
    setLoadedFileName(null);
    // Inform parent that data is unloaded
    onDataLoaded(''); // Call with empty string or null to signify unload
    // Also clear file input visually if possible
    const fileInput = document.getElementById('pkl-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
     const linkInput = document.getElementById('drive-link') as HTMLInputElement;
    if (linkInput) linkInput.value = '';
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (uploadStatus === 'success') return; // Don't change if already loaded
    setUploadStatus('idle');
    setUploadMessage(null);
    setProgress(0);
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // Basic check, consider more robust validation if needed
      if (file.name.endsWith('.pkl')) {
        setLocalFile(file);
        setDriveLink(''); // Clear drive link if a local file is selected
        const linkInput = document.getElementById('drive-link') as HTMLInputElement;
        if (linkInput) linkInput.value = '';
      } else {
        setLocalFile(null);
        event.target.value = ''; // Clear the input
        toast({
          title: "Invalid File Type",
          description: "Please select a .pkl file.",
          variant: "destructive",
        });
      }
    } else {
      setLocalFile(null);
    }
  };

  const handleLinkChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (uploadStatus === 'success') return; // Don't change if already loaded
    setUploadStatus('idle');
    setUploadMessage(null);
    setProgress(0);
    setDriveLink(event.target.value);
    if (localFile) {
      setLocalFile(null); // Clear local file if a link is typed
      const fileInput = document.getElementById('pkl-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  // Renamed simulateUpload to simulateUploadAndProcess for clarity
  const handleSubmit = () => {
    const sourceName = activeTab === 'local' ? localFile?.name : driveLink;
    if (!sourceName) {
      toast({
        title: "No Data Source",
        description: "Please select a file or provide a link.",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      setUploadStatus('loading');
      setUploadMessage(`Loading data from ${activeTab === 'local' ? 'local file' : 'Google Drive'}...`);
      setProgress(0); // Initialize progress
      toast({
        title: "Loading Data",
        description: `Starting to load ${sourceName}...`,
      });

      try {
        // Simulate loading process (e.g., 2-5 seconds) + processing time
        const uploadDuration = 1500 + Math.random() * 2000;

        // --- Simulation Logic ---
        // We use a separate function to handle the progress updates during simulation
        let currentProgress = 0;
        const intervalTime = Math.max(10, uploadDuration / 100);
        const interval = setInterval(() => {
            currentProgress += 1;
            setProgress(prev => Math.min(100, prev + 1)); // Update progress state
            if (currentProgress >= 100) {
                clearInterval(interval);
            }
        }, intervalTime);

        try {
            await simulateUploadAndProcess(uploadDuration, sourceName);
        } finally {
            clearInterval(interval); // Ensure interval is cleared even if simulation rejects
            setProgress(100); // Ensure progress reaches 100
        }
        // --- End Simulation Logic ---


        // --- Actual Implementation Placeholder ---
        // If implementing actual loading:
        // 1. Create a Server Action or API Route (`/api/load-pkl`).
        // 2. If local file:
        //    - Send `localFile` using `FormData`.
        //    - Server reads the file, parses/validates the .pkl (e.g., using a Python script via child_process or a dedicated microservice).
        //    - Return success/error status and maybe some metadata.
        // 3. If drive link:
        //    - Send `driveLink` in the request body.
        //    - Server attempts to fetch the file from the URL. Requires the link to be public/accessible.
        //    - Parse/validate the downloaded .pkl file.
        //    - Return success/error status.
        // 4. Handle potential errors (network, parsing, validation).
        // 5. Store the relevant data/metadata from the PKL file in server-side state or pass necessary info back to the client.
        // Example fetch (replace with Server Action if preferred):
        // try {
        //   let result;
        //   if (activeTab === 'local' && localFile) {
        //     const formData = new FormData();
        //     formData.append('file', localFile);
        //     const response = await fetch('/api/load-pkl', { method: 'POST', body: formData });
        //     if (!response.ok) throw new Error(`Failed to upload: ${response.statusText}`);
        //     result = await response.json();
        //   } else if (activeTab === 'drive' && driveLink) {
        //     const response = await fetch('/api/load-pkl', {
        //       method: 'POST',
        //       headers: { 'Content-Type': 'application/json' },
        //       body: JSON.stringify({ link: driveLink })
        //     });
        //     if (!response.ok) throw new Error(`Failed to load from Drive: ${response.statusText}`);
        //     result = await response.json();
        //   }
        //   // Process 'result' which might contain metadata or confirmation
        //   console.log("Actual loading successful:", result);
        // } catch (error) {
        //    console.error("Actual loading error:", error);
        //    throw error; // Re-throw to be caught by the outer catch block
        // }
        // --- End Placeholder ---

        setUploadStatus('success');
        setLoadedFileName(sourceName); // Store the loaded file name
        setUploadMessage(`Data "${sourceName}" loaded successfully! (Simulated)`);
        toast({
          title: "Load Successful",
          description: `Data from ${sourceName} is ready. (Simulated)`,
        });

        // Call the callback function passed from the parent
        // This signifies that the *conceptual* loading is done, enabling other UI parts.
        onDataLoaded(sourceName);

      } catch (error) {
        console.error("Loading error (Simulated or Placeholder):", error);
        setUploadStatus('error');
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setUploadMessage(`Error loading data: ${errorMessage}`);
        setProgress(0); // Reset progress on error
        toast({
          title: "Load Failed",
          description: `Failed to load data from ${sourceName}. ${errorMessage}`,
          variant: "destructive",
        });
         // Inform parent that data loading failed
        onDataLoaded(''); // Or null
      }
    });
  };

  const isSubmitDisabled = !(localFile || driveLink) || isPending || uploadStatus === 'loading' || uploadStatus === 'success';
  const showResetButton = uploadStatus === 'success' || uploadStatus === 'error';

  return (
    <Card className="border shadow-sm rounded-lg">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-base font-semibold">Load Model Data (.pkl)</CardTitle>
        {!loadedFileName ? (
             <CardDescription className="text-xs text-muted-foreground">
                {/* Updated description */}
                Upload a .pkl file or link. (Note: Actual PKL parsing is simulated).
             </CardDescription>
        ): (
             <CardDescription className="text-xs text-green-500 flex items-center pt-1">
                 <CheckCircle className="w-3 h-3 mr-1"/> Loaded: {loadedFileName} (Simulated)
             </CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {uploadStatus !== 'success' && (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-3">
                <TabsTrigger value="local" disabled={isPending || uploadStatus === 'loading'}>
                  <Upload className="mr-1.5 h-4 w-4" /> Local File
                </TabsTrigger>
                <TabsTrigger value="drive" disabled={isPending || uploadStatus === 'loading'}>
                  <LinkIcon className="mr-1.5 h-4 w-4" /> Google Drive
                </TabsTrigger>
              </TabsList>
              <TabsContent value="local" className="mt-0">
                <div className="space-y-1.5">
                  <Label htmlFor="pkl-upload" className="text-sm font-medium sr-only"> {/* Hide label visually */}
                    Select .pkl file
                  </Label>
                  <Input
                    id="pkl-upload"
                    type="file"
                    accept=".pkl"
                    onChange={handleFileChange}
                    disabled={isPending || uploadStatus === 'loading'}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                     aria-label="Select .pkl file from your computer"
                  />
                  {localFile && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Selected: {localFile.name}
                    </p>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="drive" className="mt-0">
                <div className="space-y-1.5">
                  <Label htmlFor="drive-link" className="text-sm font-medium sr-only"> {/* Hide label visually */}
                    Google Drive Link
                  </Label>
                  <Input
                    id="drive-link"
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={driveLink}
                    onChange={handleLinkChange}
                    disabled={isPending || uploadStatus === 'loading'}
                     aria-label="Enter Google Drive link for .pkl file"
                  />
                   <p className="text-xs text-muted-foreground">Ensure link sharing is set to 'Anyone with the link'.</p>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Loading/Status Indicator */}
        <div className="space-y-1 min-h-[40px]"> {/* Ensure consistent height */}
          {(uploadStatus === 'loading' || isPending) && (
            <>
              <Progress value={progress} className="w-full h-2" aria-label={`Loading progress: ${progress}%`} />
              <div className="flex items-center justify-center text-sm text-muted-foreground pt-1">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>{uploadMessage || 'Loading...'}</span>
              </div>
            </>
          )}
          {uploadStatus === 'success' && uploadMessage && !isPending && (
            <div className="flex items-center justify-center text-sm text-green-500">
              <CheckCircle className="mr-2 h-4 w-4" />
              <span>{uploadMessage}</span>
            </div>
          )}
          {uploadStatus === 'error' && uploadMessage && !isPending && (
            <div className="flex items-center justify-center text-sm text-destructive">
              <AlertTriangle className="mr-2 h-4 w-4" />
              <span>{uploadMessage}</span>
            </div>
          )}
           {/* Placeholder when idle and no file loaded */}
            {uploadStatus === 'idle' && !loadedFileName && !isPending && (
                 <div className="min-h-[40px] flex items-center justify-center">
                    {/* Optionally add a placeholder text/icon here if needed */}
                 </div>
            )}
        </div>

        {/* Conditional Buttons */}
        <div className="flex gap-2 pt-1">
          {!showResetButton ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitDisabled}
                className="w-full"
                aria-live="polite" // Announce loading state changes
              >
                {(isPending || uploadStatus === 'loading') ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                  </>
                ) : (
                  'Load Data' // Keep button text consistent
                )}
              </Button>
          ) : (
             <Button
                onClick={resetState}
                variant="outline"
                className="w-full"
                disabled={isPending || uploadStatus === 'loading'} // Disable reset while loading
              >
                 <RefreshCcw className="mr-2 h-4 w-4" /> Load Different Data
              </Button>
          )}
        </div>
         <p className="text-xs text-center text-muted-foreground/70 pt-1">
            Note: This simulates loading. Actual .pkl processing requires a backend setup.
        </p>
      </CardContent>
    </Card>
  );
};

export default DataUploader;
