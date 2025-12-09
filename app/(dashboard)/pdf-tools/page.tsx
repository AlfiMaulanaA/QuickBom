'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Split,
  Archive,
  RotateCw,
  Lock,
  Shuffle,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  Merge,
  Eye,
  X,
  Plus,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PDFOperation {
  id: string;
  operation: 'split' | 'compress' | 'rotate' | 'protect' | 'organize' | 'merge';
  inputFile?: string;
  inputFiles?: string[];
  outputFile?: {
    url: string;
    size: number;
    pages: number;
  };
  status: 'idle' | 'processing' | 'completed' | 'error';
  error?: string;
  createdAt: Date;
}

interface PDFFile {
  url: string;
  name: string;
  size?: number;
}

const PDF_OPERATIONS = [
  {
    id: 'compress',
    name: 'Compress PDF',
    description: 'Reduce PDF file size',
    icon: Archive,
    color: 'bg-green-500'
  },
  {
    id: 'protect',
    name: 'Protect PDF',
    description: 'Add password protection',
    icon: Lock,
    color: 'bg-red-500'
  },
  {
    id: 'merge',
    name: 'Merge PDFs',
    description: 'Combine multiple PDFs into one',
    icon: Merge,
    color: 'bg-purple-600'
  },
  {
    id: 'split',
    name: 'Split PDF',
    description: 'Split PDF into multiple files',
    icon: Split,
    color: 'bg-blue-500'
  },
  {
    id: 'organize',
    name: 'Organize PDF',
    description: 'Reorder PDF pages',
    icon: Shuffle,
    color: 'bg-indigo-500'
  },
  {
    id: 'rotate',
    name: 'Rotate PDF',
    description: 'Rotate PDF pages',
    icon: RotateCw,
    color: 'bg-orange-500'
  }
];

export default function PDFToolsPage() {
  const { toast } = useToast();

  // Main state
  const [selectedOperation, setSelectedOperation] = useState<string>('compress');
  const [operations, setOperations] = useState<PDFOperation[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // File management for single operations
  const [selectedFile, setSelectedFile] = useState<PDFFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // File management for merge operations
  const [mergeFiles, setMergeFiles] = useState<PDFFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Operation specific options
  const [splitRanges, setSplitRanges] = useState('');
  const [rotation, setRotation] = useState('');
  const [password, setPassword] = useState('');
  const [pageOrder, setPageOrder] = useState('');

  // Preview modal
  const [showPreview, setShowPreview] = useState(false);
  const [previewOperation, setPreviewOperation] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mergeInputRef = useRef<HTMLInputElement>(null);

  // Reset preview when operation changes
  useEffect(() => {
    setPreviewUrl('');
    setShowPreview(false);
  }, [selectedOperation]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file",
        description: "Please select a valid PDF file.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload file first
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      // Set the uploaded file info
      setSelectedFile({
        url: uploadResult.file.url,
        name: uploadResult.file.name,
        size: uploadResult.file.size
      });

      // Generate preview URL for display
      setPreviewUrl(URL.createObjectURL(file));

      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded and is ready for processing.`,
      });

    } catch (error: any) {
      console.error('File upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleMergeFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');

    if (pdfFiles.length === 0) {
      toast({
        title: "No valid files",
        description: "Please select PDF files only.",
        variant: "destructive",
      });
      return;
    }

    try {
      const uploadedFiles: PDFFile[] = [];

      // Upload each file
      for (const file of pdfFiles) {
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadResult = await uploadResponse.json();

        if (!uploadResult.success) {
          throw new Error(`Upload failed for ${file.name}: ${uploadResult.error}`);
        }

        uploadedFiles.push({
          url: uploadResult.file.url,
          name: uploadResult.file.name,
          size: uploadResult.file.size
        });
      }

      setMergeFiles(prev => [...prev, ...uploadedFiles]);

      toast({
        title: "Files uploaded",
        description: `${uploadedFiles.length} PDF file(s) uploaded and added to merge list.`,
      });

    } catch (error: any) {
      console.error('File upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const removeMergeFile = (index: number) => {
    setMergeFiles(prev => prev.filter((_, i) => i !== index));
  };

  const moveMergeFile = (fromIndex: number, toIndex: number) => {
    setMergeFiles(prev => {
      const newFiles = [...prev];
      const [moved] = newFiles.splice(fromIndex, 1);
      newFiles.splice(toIndex, 0, moved);
      return newFiles;
    });
  };

  const generatePreview = async () => {
    if (!selectedOperation) return;

    if (selectedOperation === 'merge' && mergeFiles.length < 2) {
      toast({
        title: "Not enough files",
        description: "Please select at least 2 PDF files to preview merge.",
        variant: "destructive",
      });
      return;
    }

    if (selectedOperation !== 'merge' && !selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to preview.",
        variant: "destructive",
      });
      return;
    }

    setPreviewOperation(selectedOperation);
    setShowPreview(true);

    try {
      // Build preview API URL
      const params = new URLSearchParams();
      params.append('operation', selectedOperation);

      if (selectedOperation === 'merge') {
        params.append('fileUrls', mergeFiles.map(f => f.url).join(','));
      } else {
        params.append('fileUrl', selectedFile!.url);
      }

      // Add operation-specific options
      const options: any = {};
      switch (selectedOperation) {
        case 'organize':
          if (pageOrder) {
            options.pageOrder = pageOrder.split(',').map((p: string) => parseInt(p.trim()));
          }
          break;
      }

      if (Object.keys(options).length > 0) {
        params.append('options', JSON.stringify(options));
      }

      const response = await fetch(`/api/pdf?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        // Preview data will be displayed in the modal
        toast({
          title: "Preview generated",
          description: "Preview shows expected result of the operation.",
        });
      } else {
        throw new Error(result.error || 'Preview generation failed');
      }
    } catch (error: any) {
      toast({
        title: "Preview failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const executeOperation = async () => {
    if (selectedOperation === 'merge') {
      if (mergeFiles.length < 2) {
        toast({
          title: "Not enough files",
          description: "Please select at least 2 PDF files to merge.",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!selectedFile) {
        toast({
          title: "Missing file",
          description: "Please select a PDF file.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsProcessing(true);

    const operationId = Date.now().toString();
    const newOperation: PDFOperation = {
      id: operationId,
      operation: selectedOperation as any,
      status: 'processing',
      createdAt: new Date()
    };

    // Set appropriate file properties based on operation type
    if (selectedOperation === 'merge') {
      newOperation.inputFiles = mergeFiles.map(f => f.url);
    } else if (selectedFile?.url) {
      newOperation.inputFile = selectedFile.url;
    }

    setOperations(prev => [newOperation, ...prev]);

    try {
      const requestBody: any = {
        operation: selectedOperation
      };

      if (selectedOperation === 'merge') {
        requestBody.fileUrls = mergeFiles.map(f => f.url);
      } else {
        requestBody.fileUrl = selectedFile?.url;
      }

      // Set operation-specific options
      const options: any = {};
      switch (selectedOperation) {
        case 'split':
          if (splitRanges) options.ranges = splitRanges;
          break;
        case 'rotate':
          if (rotation) options.rotation = parseInt(rotation);
          break;
        case 'protect':
          if (password) options.password = password;
          break;
        case 'organize':
          if (pageOrder) {
            options.pageOrder = pageOrder.split(',').map((p: string) => parseInt(p.trim()));
          }
          break;
      }

      if (Object.keys(options).length > 0) {
        requestBody.options = options;
      }

      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.success) {
        setOperations(prev => prev.map(op =>
          op.id === operationId
            ? { ...op, status: 'completed', outputFile: result.outputFile }
            : op
        ));

        toast({
          title: "Operation completed",
          description: `PDF ${selectedOperation} completed successfully.`,
        });
      } else {
        throw new Error(result.error || 'Operation failed');
      }

    } catch (error: any) {
      setOperations(prev => prev.map(op =>
        op.id === operationId
          ? { ...op, status: 'error', error: error.message }
          : op
      ));

      toast({
        title: "Operation failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getOperationIcon = (operation: string) => {
    const op = PDF_OPERATIONS.find(o => o.id === operation);
    return op ? op.icon : FileText;
  };

  const getOperationColor = (operation: string) => {
    const op = PDF_OPERATIONS.find(o => o.id === operation);
    return op ? op.color : 'bg-gray-500';
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">PDF Tools</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Process your PDF files with advanced tools powered by iLovePDF
          </p>
        </div>
      </div>

      <Tabs value={selectedOperation} onValueChange={setSelectedOperation} className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto p-1 gap-1">
          {PDF_OPERATIONS.map((op) => (
            <TabsTrigger
              key={op.id}
              value={op.id}
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm h-auto min-h-[60px] sm:min-h-[40px]"
            >
              <op.icon className="h-4 w-4 sm:h-4 sm:w-4" />
              <span className="text-center leading-tight">{op.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {PDF_OPERATIONS.map((op) => (
          <TabsContent key={op.id} value={op.id} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Configuration Panel */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <op.icon className="h-5 w-5" />
                      {op.name}
                    </CardTitle>
                    <CardDescription>{op.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {op.id === 'merge' ? (
                      // Merge files interface
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Add PDF Files</Label>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => mergeInputRef.current?.click()}
                              className="flex-1"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Files
                            </Button>
                          </div>
                          <input
                            ref={mergeInputRef}
                            type="file"
                            accept=".pdf"
                            multiple
                            onChange={handleMergeFileSelect}
                            className="hidden"
                          />
                        </div>

                        {mergeFiles.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label>Merge Order</Label>
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setMergeFiles(prev => [...prev].reverse())}
                                  disabled={mergeFiles.length < 2}
                                  className="text-xs"
                                >
                                  <ArrowUp className="h-3 w-3 mr-1" />
                                  Reverse
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-2 max-h-60 sm:max-h-80 overflow-y-auto border rounded-lg p-2">
                              {mergeFiles.map((file, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                                  <div className="flex flex-col gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => moveMergeFile(index, Math.max(0, index - 1))}
                                      disabled={index === 0}
                                      className="h-6 w-6 p-0 hover:bg-blue-100"
                                    >
                                      <ChevronUp className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => moveMergeFile(index, Math.min(mergeFiles.length - 1, index + 1))}
                                      disabled={index === mergeFiles.length - 1}
                                      className="h-6 w-6 p-0 hover:bg-blue-100"
                                    >
                                      <ChevronDown className="h-3 w-3" />
                                    </Button>
                                  </div>

                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-medium flex-shrink-0">
                                      {index + 1}
                                    </div>
                                    <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{file.name}</p>
                                      {file.size && (
                                        <p className="text-xs text-muted-foreground">
                                          {(file.size / 1024 / 1024).toFixed(1)} MB
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeMergeFile(index)}
                                    className="h-8 w-8 p-0 flex-shrink-0 hover:bg-destructive hover:text-destructive-foreground"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <p className="text-muted-foreground">
                                {mergeFiles.length} file{mergeFiles.length > 1 ? 's' : ''} ready to merge
                              </p>
                              {mergeFiles.length >= 2 && (
                                <p className="text-green-600 font-medium">
                                  ✓ Ready to merge
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      // Single file interface
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Select PDF File</Label>
                          <div className="flex gap-2">
                            <Input
                              value={selectedFile?.name || ''}
                              placeholder="No file selected..."
                              readOnly
                            />
                            <Button
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </div>

                        {/* Operation-specific options */}
                        {op.id === 'split' && (
                          <div className="space-y-2">
                            <Label>Page Ranges</Label>
                            <Input
                              value={splitRanges}
                              onChange={(e) => setSplitRanges(e.target.value)}
                              placeholder="e.g., 1-3,5,7-9"
                            />
                            <p className="text-sm text-muted-foreground">
                              Specify page ranges separated by commas (e.g., 1-3,5,7-9)
                            </p>
                          </div>
                        )}

                        {op.id === 'rotate' && (
                          <div className="space-y-2">
                            <Label>Rotation Angle</Label>
                            <Select value={rotation} onValueChange={setRotation}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select rotation..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="90">90° Clockwise</SelectItem>
                                <SelectItem value="180">180°</SelectItem>
                                <SelectItem value="270">270° Counter-clockwise</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {op.id === 'protect' && (
                          <div className="space-y-2">
                            <Label>Password</Label>
                            <Input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Enter password..."
                            />
                          </div>
                        )}

                        {op.id === 'organize' && (
                          <div className="space-y-2">
                            <Label>Page Order</Label>
                            <Input
                              value={pageOrder}
                              onChange={(e) => setPageOrder(e.target.value)}
                              placeholder="e.g., 3,1,2,4"
                            />
                            <p className="text-sm text-muted-foreground">
                              Specify new page order separated by commas (e.g., 3,1,2,4)
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2">
                      {((op.id === 'merge' && mergeFiles.length >= 2) ||
                        (op.id === 'organize' && selectedFile) ||
                        (op.id !== 'merge' && op.id !== 'organize' && selectedFile)) && (
                        <Dialog open={showPreview} onOpenChange={setShowPreview}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="flex-1 sm:flex-none" onClick={generatePreview}>
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="w-[98vw] max-w-[95vw] h-[95vh] max-h-[95vh] p-2 sm:p-4">
                            <DialogHeader className="space-y-2 pb-2">
                              <DialogTitle className="text-xl sm:text-2xl font-bold">Preview: {op.name}</DialogTitle>
                              <DialogDescription className="text-sm sm:text-base">
                                This shows how your PDF will look after processing
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 min-h-[400px] sm:min-h-[500px] border-2 border-border rounded-lg overflow-hidden bg-muted/10">
                              {previewUrl ? (
                                <iframe
                                  src={previewUrl}
                                  className="w-full h-full border-0"
                                  title="PDF Preview"
                                  style={{ minHeight: '500px' }}
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground p-8">
                                  <div className="text-center space-y-4">
                                    <FileText className="mx-auto h-16 w-16 sm:h-20 sm:w-20 opacity-50" />
                                    <div>
                                      <p className="text-base sm:text-lg font-medium">Preview not available</p>
                                      <p className="text-sm sm:text-base text-muted-foreground mt-2">
                                        Upload a file first to see preview
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}

                      <Button
                        onClick={executeOperation}
                        disabled={
                          (op.id === 'merge' ? mergeFiles.length < 2 : !selectedFile) ||
                          isProcessing
                        }
                        className="flex-1"
                        size="default"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            <span className="hidden sm:inline">Processing...</span>
                            <span className="sm:hidden">Processing</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Execute {op.name}</span>
                            <span className="sm:hidden">Execute</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Operations History */}
              <div className="lg:col-span-1 order-first lg:order-last">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg sm:text-xl">Operation History</CardTitle>
                    <CardDescription className="text-sm">Recent PDF operations</CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6">
                    {operations.filter(op => op.operation === selectedOperation).length === 0 ? (
                      <div className="text-center py-6 sm:py-8 text-muted-foreground">
                        <op.icon className="mx-auto h-8 w-8 sm:h-12 sm:w-12 mb-3 sm:mb-4 opacity-50" />
                        <p className="text-sm sm:text-base">No {op.name.toLowerCase()} operations yet</p>
                        <p className="text-xs sm:text-sm mt-1">Operations will appear here after processing</p>
                      </div>
                    ) : (
                      <div className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
                        {operations
                          .filter(operation => operation.operation === selectedOperation)
                          .slice(0, 5) // Show only last 5 operations on mobile
                          .map((operation) => (
                            <Card key={operation.id} className="p-3 sm:p-4 shadow-sm">
                              <div className="flex items-start sm:items-center justify-between mb-3 gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <div className={`p-1.5 rounded ${getOperationColor(operation.operation)} text-white flex-shrink-0`}>
                                    {React.createElement(getOperationIcon(operation.operation), { className: "h-3 w-3" })}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium block truncate">Operation</span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(operation.createdAt).toLocaleTimeString()}
                                    </span>
                                  </div>
                                </div>
                                <Badge
                                  variant={
                                    operation.status === 'completed' ? 'default' :
                                    operation.status === 'error' ? 'destructive' :
                                    operation.status === 'processing' ? 'secondary' : 'outline'
                                  }
                                  className="text-xs flex-shrink-0"
                                >
                                  {operation.status === 'processing' && <Loader2 className="w-2 h-2 mr-1 animate-spin" />}
                                  {operation.status}
                                </Badge>
                              </div>

                              {operation.status === 'processing' && (
                                <Progress value={50} className="mb-3 h-1.5" />
                              )}

                              {operation.error && (
                                <Alert className="mb-3 border-destructive/50">
                                  <AlertCircle className="h-3 w-3" />
                                  <AlertDescription className="text-xs">
                                    {operation.error}
                                  </AlertDescription>
                                </Alert>
                              )}

                              {operation.outputFile && (
                                <div className="space-y-2">
                                  <div className="text-xs text-muted-foreground">
                                    Size: {(operation.outputFile.size / 1024 / 1024).toFixed(1)} MB •
                                    Pages: {operation.outputFile.pages}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => downloadFile(operation.outputFile!.url, `processed_${operation.operation}.pdf`)}
                                    className="w-full text-xs h-8"
                                  >
                                    <Download className="h-3 w-3 mr-2" />
                                    Download
                                  </Button>
                                </div>
                              )}
                            </Card>
                          ))}
                        {operations.filter(op => op.operation === selectedOperation).length > 5 && (
                          <p className="text-xs text-center text-muted-foreground py-2">
                            Showing last 5 operations
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
