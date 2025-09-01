
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: 'planning' | 'active' | 'completed' | 'cancelled' | 'pending' | 'confirmed' | 'rejected';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch(status) {
    // Event statuses
    case 'planning':
      return (
        <Badge 
          variant="outline" 
          className="bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20 font-medium"
        >
          Em Planejamento
        </Badge>
      );
    case 'active':
      return (
        <Badge 
          variant="outline" 
          className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 font-medium neon-glow"
        >
          Ativo
        </Badge>
      );
    case 'completed':
      return (
        <Badge 
          variant="outline" 
          className="bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20 font-medium"
        >
          Concluído
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge 
          variant="outline" 
          className="bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 font-medium"
        >
          Cancelado
        </Badge>
      );
    
    // Allocation statuses
    case 'pending':
      return (
        <Badge 
          variant="outline" 
          className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20 font-medium"
        >
          Pendente
        </Badge>
      );
    case 'confirmed':
      return (
        <Badge 
          variant="outline" 
          className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 font-medium neon-glow"
        >
          Confirmado
        </Badge>
      );
    case 'rejected':
      return (
        <Badge 
          variant="outline" 
          className="bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 font-medium"
        >
          Recusado
        </Badge>
      );
    
    default:
      return null;
  }
};

export default StatusBadge;
