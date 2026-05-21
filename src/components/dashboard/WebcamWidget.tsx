'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Download, Settings, AlertCircle } from 'lucide-react';

export default function WebcamWidget() {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Webcam starten
  const startWebcam = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'environment' // Bevorzuge Rückkamera auf mobilen Geräten
        },
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsActive(true);
      }
    } catch (err) {
      console.error('Fehler beim Zugriff auf die Webcam:', err);
      setError('Webcam-Zugriff fehlgeschlagen. Bitte überprüfen Sie die Berechtigungen.');
    } finally {
      setLoading(false);
    }
  };

  // Webcam stoppen
  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  };

  // Foto aufnehmen
  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      if (context) {
        context.drawImage(videoRef.current, 0, 0);
        
        // Foto als Download anbieten
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `garten-foto-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.jpg`;
            link.click();
            URL.revokeObjectURL(url);
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  // Cleanup beim Unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  return (
    <div className="space-y-3">
      {/* Video Container */}
      <div className="relative">
        {isActive ? (
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-32 object-cover"
            />
            {/* Overlay-Controls */}
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                size="sm"
                variant="secondary"
                onClick={takePhoto}
                className="h-6 w-6 p-0"
              >
                <Camera className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
            {loading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-xs text-muted-foreground">Starte Webcam...</p>
              </div>
            ) : error ? (
              <div className="text-center px-4">
                <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                <p className="text-xs text-red-500 text-center">{error}</p>
              </div>
            ) : (
              <div className="text-center">
                <CameraOff className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Webcam inaktiv</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex gap-2">
        {isActive ? (
          <>
            <Button
              size="sm"
              variant="destructive"
              onClick={stopWebcam}
              className="flex-1"
            >
              <CameraOff className="h-3 w-3 mr-1" />
              Stop
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={takePhoto}
              className="flex-1"
            >
              <Download className="h-3 w-3 mr-1" />
              Foto
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="default"
            onClick={startWebcam}
            disabled={loading}
            className="w-full"
          >
            <Camera className="h-3 w-3 mr-1" />
            Webcam starten
          </Button>
        )}
      </div>

      {/* Info Text */}
      <p className="text-xs text-muted-foreground text-center">
        Garten-Webcam für Dokumentation und Überwachung
      </p>
    </div>
  );
}
