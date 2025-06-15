
import { useEffect } from 'react';

const Index = () => {
  useEffect(() => {
    // Redirect to cadastro.html since this is a vanilla HTML/CSS/JS project
    window.location.href = '/cadastro.html';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Lista de Compras</h1>
        <p className="text-xl text-muted-foreground">Redirecionando para o sistema...</p>
      </div>
    </div>
  );
};

export default Index;
