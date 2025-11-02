"use client"

import { useState } from "react"
import { ExternalLink, Copy, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface GoogleDriveLinkProps {
  value: string
  onChange: (url: string) => void
  onPreview?: (url: string) => void
  className?: string
}

export function GoogleDriveLink({ value, onChange, onPreview, className }: GoogleDriveLinkProps) {
  const [copied, setCopied] = useState(false)
  const [isValid, setIsValid] = useState<boolean | null>(null)

  const validateGoogleDriveUrl = (url: string): boolean => {
    const patterns = [
      /^https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
      /^https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
      /^https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/
    ]
    
    return patterns.some(pattern => pattern.test(url))
  }

  const handleUrlChange = (url: string) => {
    onChange(url)
    if (url) {
      setIsValid(validateGoogleDriveUrl(url))
    } else {
      setIsValid(null)
    }
  }

  const convertToPreviewUrl = (url: string): string => {
    // Converter URL do Google Drive para formato de preview
    const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
    if (fileIdMatch) {
      return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`
    }
    return url
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Erro ao copiar:', err)
    }
  }

  const openPreview = () => {
    if (value && isValid) {
      const previewUrl = convertToPreviewUrl(value)
      window.open(previewUrl, '_blank')
    }
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Link do Google Drive
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="drive-url">URL do Google Drive</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="drive-url"
                placeholder="https://drive.google.com/file/d/..."
                value={value}
                onChange={(e) => handleUrlChange(e.target.value)}
                className={isValid === false ? 'border-red-500' : isValid === true ? 'border-green-500' : ''}
              />
              {value && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="shrink-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              )}
            </div>
            
            {isValid === false && (
              <div className="flex items-center gap-2 mt-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">URL inválida do Google Drive</span>
              </div>
            )}
            
            {isValid === true && (
              <div className="flex items-center gap-2 mt-2 text-green-600">
                <Check className="h-4 w-4" />
                <span className="text-sm">URL válida do Google Drive</span>
              </div>
            )}
          </div>

          {value && isValid && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Válido
                </Badge>
              </div>
              
              <Button
                variant="outline"
                onClick={openPreview}
                className="w-full"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Visualizar PDF
              </Button>
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Formatos suportados:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>https://drive.google.com/file/d/[ID]/view</li>
              <li>https://drive.google.com/open?id=[ID]</li>
              <li>https://docs.google.com/document/d/[ID]</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
