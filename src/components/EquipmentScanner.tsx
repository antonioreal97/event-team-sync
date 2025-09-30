import React, { useState, useRef, useEffect } from 'react';
import { QrCode, Camera, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { EquipmentItem, EquipmentItemReservation } from '@/types';
import { resolveAssetTag } from '@/services/equipmentReservationsService';

interface EquipmentScannerProps {
  eventId: string;
  onItemScanned: (item: EquipmentItem, reservation?: EquipmentItemReservation) => void;
  onError?: (error: string) => void;
}

export default function EquipmentScanner({ eventId, onItemScanned, onError }: EquipmentScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItem, setScannedItem] = useState<EquipmentItem | null>(null);
  const [scannedReservation, setScannedReservation] = useState<EquipmentItemReservation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const startScanning = async () => {
    try {
      setError(null);
      setScannedItem(null);
      setScannedReservation(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
      }
    } catch (err) {
      const errorMessage = 'Erro ao acessar a câmera. Verifique as permissões.';
      setError(errorMessage);
      onError?.(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleManualScan = async () => {
    if (!manualCode.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite um código para escanear',
        variant: 'destructive',
      });
      return;
    }

    await processScannedCode(manualCode.trim());
  };

  const processScannedCode = async (code: string) => {
    try {
      setError(null);
      const result = await resolveAssetTag(code, eventId);
      
      setScannedItem(result.item);
      setScannedReservation(result.activeReservation || null);
      
      onItemScanned(result.item, result.activeReservation || undefined);
      
      toast({
        title: 'Item Escaneado',
        description: `Item ${result.item.assetTag} encontrado com sucesso`,
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao processar código escaneado';
      setError(errorMessage);
      onError?.(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Simular detecção de QR Code (em produção, usar uma biblioteca como @zxing/browser)
  const handleVideoClick = () => {
    // Em uma implementação real, aqui seria onde o QR Code seria detectado
    // Por enquanto, vamos simular com um prompt
    const code = prompt('Digite o código do QR Code (simulação):');
    if (code) {
      processScannedCode(code);
    }
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const statusMap = {
      reserved: { label: 'Reservado', variant: 'secondary' as const },
      checked_out: { label: 'Retirado', variant: 'default' as const },
      returned: { label: 'Devolvido', variant: 'outline' as const },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const }
    };
    return statusMap[status as keyof typeof statusMap] || { label: status, variant: 'default' as const };
  };

  const getConditionBadge = (condition: string) => {
    const conditionMap = {
      excellent: { label: 'Excelente', variant: 'default' as const },
      good: { label: 'Bom', variant: 'secondary' as const },
      fair: { label: 'Regular', variant: 'outline' as const },
      poor: { label: 'Ruim', variant: 'destructive' as const },
      damaged: { label: 'Danificado', variant: 'destructive' as const }
    };
    return conditionMap[condition as keyof typeof conditionMap] || { label: condition, variant: 'default' as const };
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Scanner de Equipamentos
          </CardTitle>
          <CardDescription>
            Escaneie o QR Code do equipamento para verificar informações e status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isScanning ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-32 h-32 bg-muted rounded-lg flex items-center justify-center">
                <Camera className="h-16 w-16 text-muted-foreground" />
              </div>
              <Button onClick={startScanning} className="w-full">
                <Camera className="h-4 w-4 mr-2" />
                Iniciar Scanner
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-64 bg-black rounded-lg object-cover cursor-pointer"
                  onClick={handleVideoClick}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg flex items-center justify-center">
                    <QrCode className="h-12 w-12 text-white" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={stopScanning} variant="outline" className="flex-1">
                  Parar Scanner
                </Button>
                <Button onClick={handleVideoClick} className="flex-1">
                  Simular Leitura
                </Button>
              </div>
            </div>
          )}

          {/* Entrada manual */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Ou digite o código manualmente:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Digite a etiqueta de patrimônio..."
                className="flex-1 px-3 py-2 border border-input rounded-md text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
              />
              <Button onClick={handleManualScan} disabled={!manualCode.trim()}>
                Escanear
              </Button>
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}

          {/* Item escaneado */}
          {scannedItem && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-semibold">Item Encontrado</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-lg font-bold">{scannedItem.assetTag}</span>
                  {scannedReservation && (
                    <Badge {...getStatusBadge(scannedReservation.status)}>
                      {getStatusBadge(scannedReservation.status)?.label}
                    </Badge>
                  )}
                </div>
                
                <div>
                  <p className="font-medium">{scannedItem.equipmentName}</p>
                  {scannedItem.serialNumber && (
                    <p className="text-sm text-muted-foreground">
                      Série: {scannedItem.serialNumber}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Badge {...getConditionBadge(scannedItem.condition)}>
                    {getConditionBadge(scannedItem.condition).label}
                  </Badge>
                  {scannedItem.categoryName && (
                    <Badge variant="outline">
                      {scannedItem.categoryName}
                    </Badge>
                  )}
                </div>

                {scannedItem.location && (
                  <p className="text-sm text-muted-foreground">
                    📍 {scannedItem.location}
                  </p>
                )}

                {scannedItem.notes && (
                  <p className="text-sm text-muted-foreground">
                    {scannedItem.notes}
                  </p>
                )}

                {scannedReservation && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-1">Informações da Reserva:</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {scannedReservation.reservedByName && (
                        <p>Reservado por: {scannedReservation.reservedByName}</p>
                      )}
                      {scannedReservation.checkedOutByName && (
                        <p>Retirado por: {scannedReservation.checkedOutByName}</p>
                      )}
                      {scannedReservation.checkedInByName && (
                        <p>Devolvido por: {scannedReservation.checkedInByName}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

