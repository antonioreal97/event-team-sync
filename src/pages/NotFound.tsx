
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="text-center space-y-6 max-w-md mx-auto">
        <div className="h-20 w-20 bg-event-DEFAULT rounded-xl flex items-center justify-center text-white font-heading font-bold text-3xl mx-auto">
          404
        </div>
        
        <div>
          <h1 className="text-3xl font-heading font-bold">Página não encontrada</h1>
          <p className="mt-2 text-gray-600">
            A página que você está procurando não existe ou foi movida.
          </p>
        </div>
        
        <div className="pt-4">
          <Button asChild>
            <Link to="/dashboard">Voltar para o Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
