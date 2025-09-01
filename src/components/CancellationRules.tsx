import React from 'react';
import { AlertTriangle, Clock, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CancellationRulesProps {
  eventStartDate: string;
  cancellationDeadline: string;
  showRules?: boolean;
}

const CancellationRules: React.FC<CancellationRulesProps> = ({ 
  eventStartDate, 
  cancellationDeadline, 
  showRules = true 
}) => {
  const now = new Date();
  const eventDate = new Date(eventStartDate);
  const deadline = new Date(cancellationDeadline);
  const canCancel = now < deadline;
  const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const daysUntilEvent = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (!showRules) return null;

  return (
    <Alert className={`mt-4 ${canCancel ? 'border-orange-200 bg-orange-50' : 'border-red-200 bg-red-50'}`}>
      {canCancel ? (
        <Clock className="h-4 w-4 text-orange-600" />
      ) : (
        <XCircle className="h-4 w-4 text-red-600" />
      )}
      
      <AlertDescription className={canCancel ? 'text-orange-800' : 'text-red-800'}>
        <div className="space-y-1">
          <div className="font-medium">
            {canCancel ? 'Regras de Cancelamento' : 'Cancelamento Não Permitido'}
          </div>
          
          {canCancel ? (
            <div className="text-sm space-y-1">
              <p>• Você pode cancelar sua participação até <strong>{daysUntilDeadline} dia{daysUntilDeadline > 1 ? 's' : ''}</strong> antes do evento</p>
              <p>• Após esse prazo, o cancelamento não será permitido</p>
              <p>• Data limite: <strong>{deadline.toLocaleDateString('pt-BR')}</strong></p>
              <p>• Evento em: <strong>{daysUntilEvent} dia{daysUntilEvent > 1 ? 's' : ''}</strong></p>
            </div>
          ) : (
            <div className="text-sm">
              <p>• O prazo para cancelamento expirou em <strong>{deadline.toLocaleDateString('pt-BR')}</strong></p>
              <p>• Você deve participar do evento conforme confirmado</p>
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default CancellationRules;
