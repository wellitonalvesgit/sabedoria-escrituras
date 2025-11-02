"use client"

import { useState } from "react"
import { Play, ExternalLink, Youtube, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

interface YouTubeVideoPlayerProps {
  youtubeUrl?: string
  volumeTitle: string
  volumeNumber: string
  className?: string
}

export const YouTubeVideoPlayer = ({ 
  youtubeUrl, 
  volumeTitle, 
  volumeNumber,
  className 
}: YouTubeVideoPlayerProps) => {
  const [isEmbedded, setIsEmbedded] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  if (!youtubeUrl) {
    return null
  }

  // Extrair ID do vídeo do YouTube
  const getYouTubeVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  const videoId = getYouTubeVideoId(youtubeUrl)
  
  if (!videoId) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-destructive">
            <Youtube className="h-4 w-4" />
            <span className="text-sm">URL do YouTube inválida</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0`
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

  return (
    <Card className={`${className} ${isFullscreen ? 'fixed inset-0 z-50 m-0 rounded-none' : ''}`}>
      <CardContent className="p-0">
        {/* Header do Player */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-red-600 to-red-700 text-white">
          <div className="flex items-center gap-2">
            <Youtube className="h-5 w-5" />
            <div>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {volumeNumber}
              </Badge>
              <h3 className="text-sm font-medium truncate max-w-xs">
                {volumeTitle}
              </h3>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Toggle Embed/External */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEmbedded(!isEmbedded)}
              className="text-white hover:bg-white/20"
            >
              {isEmbedded ? (
                <>
                  <ExternalLink className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Abrir no YouTube</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Reproduzir Aqui</span>
                </>
              )}
            </Button>

            {/* Fullscreen Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-white hover:bg-white/20"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Player Content */}
        <div className={`${isFullscreen ? 'h-screen' : 'aspect-video'} relative bg-black`}>
          {isEmbedded ? (
            // Player Embed
            <iframe
              src={embedUrl}
              title={`${volumeTitle} - ${volumeNumber}`}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            // Thumbnail com Link Externo
            <div className="relative w-full h-full group cursor-pointer">
              <Image
                src={thumbnailUrl}
                alt={`Thumbnail do vídeo ${volumeTitle}`}
                fill
                className="object-cover"
                onError={(e) => {
                  // Fallback para thumbnail padrão se a imagem não carregar
                  e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                }}
              />
              
              {/* Overlay com Play Button */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                <div className="text-center text-white">
                  <div className="bg-red-600 rounded-full p-4 mx-auto mb-3 group-hover:bg-red-700 transition-colors">
                    <Play className="h-8 w-8 fill-white" />
                  </div>
                  <p className="text-lg font-semibold mb-1">Assistir no YouTube</p>
                  <p className="text-sm opacity-90">Clique para abrir o vídeo</p>
                </div>
              </div>

              {/* Click Handler */}
              <div 
                className="absolute inset-0"
                onClick={() => window.open(youtubeUrl, '_blank')}
              />
            </div>
          )}
        </div>

        {/* Footer com Informações */}
        <div className="p-3 bg-muted/50 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {isEmbedded ? 'Reproduzindo na plataforma' : 'Abrir no YouTube'}
            </span>
            <span>
              Vídeo do YouTube • {volumeNumber}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

