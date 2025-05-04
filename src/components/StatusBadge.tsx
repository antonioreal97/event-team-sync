
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: 'planning' | 'active' | 'completed' | 'cancelled' | 'pending' | 'confirmed' | 'rejected';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch(status) {
    // Event statuses
    case 'planning':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">Em Planejamento</Badge>;
    case 'active':
      return <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">Ativo</Badge>;
    case 'completed':
      return <Badge variant="outline" className="bg-gray-100 text-gray-700 hover:bg-gray-100">Concluído</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50">Cancelado</Badge>;
    
    // Allocation statuses
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50">Pendente</Badge>;
    case 'confirmed':
      return <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">Confirmado</Badge>;
    case 'rejected':
      return <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50">Recusado</Badge>;
    
    default:
      return null;
  }
};

export default StatusBadge;
