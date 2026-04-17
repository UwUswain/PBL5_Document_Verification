"use client"

import { useState, useRef } from "react"
import { Upload, FileImage } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

interface UploadSectionProps {
  onUpload: (file: File) => Promise<void>
}

export function UploadSection({ onUpload }: UploadSectionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setError("")
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first")
      return
    }

    setError("")
    setIsUploading(true)

    try {
      await onUpload(selectedFile)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (err) {
      setError("Upload failed. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="border border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">Upload New Document</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <label
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary p-8 transition-colors hover:border-primary"
          htmlFor="file-upload"
        >
          <input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
          {selectedFile ? (
            <>
              <FileImage className="mb-2 h-10 w-10 text-primary" />
              <p className="text-sm font-medium text-foreground">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Click to change file
              </p>
            </>
          ) : (
            <>
              <Upload className="mb-2 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag and drop or click to select
              </p>
            </>
          )}
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isUploading ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Processing AI...
            </>
          ) : (
            "Verify with AI"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
