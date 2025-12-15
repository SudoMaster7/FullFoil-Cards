import React from 'react';
import CardScanner from '../components/scanner/CardScanner';

const Scanner = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center py-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Identificar Carta</h1>
        <p className="text-gray-400 text-sm">
          Tire uma foto clara da carta para identificar e ver o valor de mercado.
        </p>
      </div>
      
      <CardScanner />
    </div>
  );
};

export default Scanner;
