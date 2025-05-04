
"use client";

import React, { useState, ChangeEvent, useTransition } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Link as LinkIcon, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress"; // Import Progress

type UploadStatus = 'idle' | 'loading' | 'success' | 'error';

const DataUploader: React.FC = () => {
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [driveLink, setDriveLink] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('local');
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0); // Progress state
  const [isPending, startTransition] = useTransition(); // For smoother UI updates
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUploadStatus('idle'); // Reset status on new selection
    setUploadMessage(null);
    setProgress(0);
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.name.endsWith('.pkl')) {
        setLocalFile(file);
        setDriveLink(''); // Clear drive link
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
    setUploadStatus('idle'); // Reset status on new input
    setUploadMessage(null);
    setProgress(0);
    setDriveLink(event.target.value);
    if (localFile) {
      setLocalFile(null); // Clear local file
      const fileInput = document.getElementById('pkl-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  const simulateUpload = (duration: number) => {
    return new Promise<void>((resolve, reject) => {
      let currentProgress = 0;
      const intervalTime = duration / 100; // Update progress every interval

      const interval = setInterval(() => {
        currentProgress += 1;
        setProgress(currentProgress);
        if (currentProgress >= 100) {
          clearInterval(interval);
          // Simulate potential random failure
          // if (Math.random() > 0.8) { // ~20% chance of failure
          //   reject(new Error("Simulated upload failure."));
          // } else {
             resolve();
          // }
          resolve(); // Always resolve for now
        }
      }, intervalTime);
    });
  };


  const handleSubmit = () => {
    const source = activeTab === 'local' ? localFile?.name : driveLink;
    if (!source) {
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
      setProgress(0); // Reset progress
      toast({
        title: "Loading Data",
        description: `Starting to load ${source}...`,
      });

      try {
        // Simulate loading process (e.g., 2-5 seconds)
        await simulateUpload(2000 + Math.random() * 3000);

        // --- Actual Implementation Placeholder ---
        // if (activeTab === 'local' && localFile) {
        //   // const formData = new FormData();
        //   // formData.append('file', localFile);
        //   // const response = await fetch('/api/upload-pkl', { method: 'POST', body: formData });
        //   // if (!response.ok) throw new Error('Failed to upload file');
        //   console.log("Simulated processing of local file:", localFile.name);
        // } else if (activeTab === 'drive' && driveLink) {
        //   // const response = await fetch('/api/load-drive-pkl', { method: 'POST', body: JSON.stringify({ link: driveLink }) });
        //   // if (!response.ok) throw new Error('Failed to load from Drive link');
        //   console.log("Simulated processing of Google Drive link:", driveLink);
        // }
        // -----------------------------------------

        setUploadStatus('success');
        setUploadMessage("Data loaded successfully!");
        toast({
          title: "Load Successful",
          description: `Data from ${source} loaded.`,
        });
        // TODO: Dispatch event or update global state with loaded data/status

      } catch (error) {
        console.error("Loading error:", error);
        setUploadStatus('error');
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setUploadMessage(`Error loading data: ${errorMessage}`);
        setProgress(0); // Reset progress on error
        toast({
          title: "Load Failed",
          description: `Failed to load data from ${source}. ${errorMessage}`,
          variant: "destructive",
        });
      }
    });
  };

  const isSubmitDisabled = !(localFile || driveLink) || isPending || uploadStatus === 'loading';

  return (
    <Card>
      <CardHeader className="pb-2 pt-2">
        <CardTitle className="text-base">Load Model Data (.pkl)</CardTitle>
        <CardDescription className="text-xs">Upload a .pkl file or provide a Google Drive link.</CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
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
          {uploadStatus === 'success' && uploadMessage && (
            <div className="flex items-center justify-center text-sm text-green-500">
              <CheckCircle className="mr-2 h-4 w-4" />
              <span>{uploadMessage}</span>
            </div>
          )}
          {uploadStatus === 'error' && uploadMessage && (
            <div className="flex items-center justify-center text-sm text-destructive">
              <AlertTriangle className="mr-2 h-4 w-4" />
              <span>{uploadMessage}</span>
            </div>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          className="w-full"
        >
          {(isPending || uploadStatus === 'loading') ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
            </>
          ) : uploadStatus === 'success' ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" /> Loaded
            </>
          ): (
            'Load Data'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DataUploader;
