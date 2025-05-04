
"use client";

import React, { useState, ChangeEvent } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Link as LinkIcon } from 'lucide-react';

const DataUploader: React.FC = () => {
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [driveLink, setDriveLink] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('local');

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.name.endsWith('.pkl')) {
        setLocalFile(file);
        // Reset drive link if a local file is selected
        setDriveLink('');
      } else {
        // Handle incorrect file type - maybe show a toast?
        alert("Please select a .pkl file.");
        event.target.value = ''; // Clear the input
        setLocalFile(null);
      }
    }
  };

  const handleLinkChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDriveLink(event.target.value);
    // Reset local file if a drive link is entered
    if (localFile) {
      setLocalFile(null);
      // Clear the file input visually if possible (might need a ref)
      const fileInput = document.getElementById('pkl-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  const handleSubmit = () => {
    if (activeTab === 'local' && localFile) {
      console.log("Uploading local file:", localFile.name);
      // TODO: Implement local file upload logic
    } else if (activeTab === 'drive' && driveLink) {
      console.log("Using Google Drive link:", driveLink);
      // TODO: Implement Google Drive link processing logic
    } else {
      console.log("No valid input provided.");
    }
  };

  const isSubmitDisabled = !(localFile || driveLink);

  return (
    <Card>
      <CardHeader className="pb-2 pt-2">
        <CardTitle className="text-base">Load Model Data (.pkl)</CardTitle>
        <CardDescription className="text-xs">Upload a .pkl file from your device or provide a Google Drive link.</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="local">
              <Upload className="mr-2 h-4 w-4" /> Local File
            </TabsTrigger>
            <TabsTrigger value="drive">
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
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
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
              />
               <p className="text-xs text-muted-foreground">Ensure the link sharing is set to 'Anyone with the link'.</p>
            </div>
          </TabsContent>
        </Tabs>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          className="w-full mt-4"
        >
          Load Data
        </Button>
      </CardContent>
    </Card>
  );
};

export default DataUploader;
