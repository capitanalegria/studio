
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
  onDataLoaded: (fileName: string) => void; // Callback when data is loaded
}

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

  const simulateUpload = (duration: number, fileName: string) => {
    return new Promise<void>((resolve, reject) => {
      let currentProgress = 0;
      const intervalTime = duration / 100;

      const interval = setInterval(() => {
        currentProgress += 1;
        setProgress(currentProgress);
        if (currentProgress >= 100) {
          clearInterval(interval);
          // Simulate actual processing time after "upload"
          setTimeout(() => {
            console.log(`Simulated processing complete for: ${fileName}`);
            // TODO: Replace with actual .pkl file processing logic
            // This is where you'd parse the file and potentially store its contents
            // For now, we just resolve successfully.
            resolve();
          }, 500); // Simulate 500ms processing time
        }
      }, intervalTime);
    });
  };


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
      setProgress(0);
      toast({
        title: "Loading Data",
        description: `Starting to load ${sourceName}...`,
      });

      try {
        // Simulate loading process (e.g., 2-5 seconds) + processing time
        const uploadDuration = 1500 + Math.random() * 2000;
        await simulateUpload(uploadDuration, sourceName);

        // --- Actual Implementation Placeholder ---
        // If using server actions or API routes:
        // if (activeTab === 'local' && localFile) {
        //   // const formData = new FormData();
        //   // formData.append('file', localFile);
        //   // const response = await fetch('/api/upload-pkl', { method: 'POST', body: formData });
        //   // if (!response.ok) throw new Error('Failed to upload file');
        //   // const result = await response.json(); // Process result
        // } else if (activeTab === 'drive' && driveLink) {
        //   // const response = await fetch('/api/load-drive-pkl', { method: 'POST', body: JSON.stringify({ link: driveLink }) });
        //   // if (!response.ok) throw new Error('Failed to load from Drive link');
        //   // const result = await response.json(); // Process result
        // }
        // --- End Placeholder ---

        setUploadStatus('success');
        setLoadedFileName(sourceName); // Store the loaded file name
        setUploadMessage(`Data "${sourceName}" loaded successfully!`);
        toast({
          title: "Load Successful",
          description: `Data from ${sourceName} is ready.`,
        });

        // Call the callback function passed from the parent
        onDataLoaded(sourceName);

      } catch (error) {
        console.error("Loading error:", error);
        setUploadStatus('error');
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setUploadMessage(`Error loading data: ${errorMessage}`);
        setProgress(0); // Reset progress on error
        toast({
          title: "Load Failed",
          description: `Failed to load data from ${sourceName}. ${errorMessage}`,
          variant: "destructive",
        });
      }
    });
  };

  const isSubmitDisabled = !(localFile || driveLink) || isPending || uploadStatus === 'loading' || uploadStatus === 'success';
  const showResetButton = uploadStatus === 'success' || uploadStatus === 'error';

  return (
    <Card>
      <CardHeader className="pb-2 pt-2">
        <CardTitle className="text-base">Load Model Data (.pkl)</CardTitle>
        {!loadedFileName ? (
            <CardDescription className="text-xs">Upload a .pkl file or provide a Google Drive link.</CardDescription>
        ): (
             <CardDescription className="text-xs text-green-500 flex items-center">
                 <CheckCircle className="w-3 h-3 mr-1"/> Loaded: {loadedFileName}
             </CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {uploadStatus !== 'success' && (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="local" disabled={isPending || uploadStatus === 'loading'}>
                  <Upload className="mr-2 h-4 w-4" /> Local File
                </TabsTrigger>
                <TabsTrigger value="drive" disabled={isPending || uploadStatus === 'loading'}>
                  <LinkIcon className="mr-2 h-4 w-4" /> Google Drive
                </TabsTrigger>
              </TabsList>
              <TabsContent value="local">
                <div className="space-y-2">
                  <Label htmlFor="pkl-upload" className="text-sm font-medium">
                    Select .pkl file
                  </Label>
                  <Input
                    id="pkl-upload"
                    type="file"
                    accept=".pkl"
                    onChange={handleFileChange}
                    disabled={isPending || uploadStatus === 'loading'}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {localFile && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Selected: {localFile.name}
                    </p>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="drive">
                <div className="space-y-2">
                  <Label htmlFor="drive-link" className="text-sm font-medium">
                    Google Drive Link
                  </Label>
                  <Input
                    id="drive-link"
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={driveLink}
                    onChange={handleLinkChange}
                    disabled={isPending || uploadStatus === 'loading'}
                  />
                   <p className="text-xs text-muted-foreground">Ensure link sharing is set to 'Anyone with the link'.</p>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Loading/Status Indicator */}
        <div className="space-y-2 min-h-[40px]"> {/* Ensure consistent height */}
          {(uploadStatus === 'loading' || isPending) && (
            <>
              <Progress value={progress} className="w-full h-2" />
              <div className="flex items-center justify-center text-sm text-muted-foreground">
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
        </div>

        {/* Conditional Buttons */}
        <div className="flex gap-2">
          {!showResetButton ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitDisabled}
                className="w-full"
              >
                {(isPending || uploadStatus === 'loading') ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                  </>
                ) : (
                  'Load Data'
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
      </CardContent>
    </Card>
  );
};

export default DataUploader;
