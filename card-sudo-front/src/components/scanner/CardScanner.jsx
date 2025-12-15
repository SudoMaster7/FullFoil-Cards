import React, { useState, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import api from '../../services/api';

const CardScanner = () => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Show preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setLoading(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      // TODO: Implement the actual endpoint in backend
      // const response = await api.post('/scanner/identify/', formData, {
      //   headers: {
      //     'Content-Type': 'multipart/form-data',
      //   },
      // });
      // console.log(response.data);
      
      // Simulating API call for MVP
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Carta enviada para análise! (Simulação)');

    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
      alert('Falha ao enviar imagem.');
    } finally {
      setLoading(false);
    }
  };

  const triggerCamera = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="flex flex-col items-center justify-center w-full p-4">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileSelect}
      />

      {preview ? (
        <div className="relative w-full max-w-md aspect-[3/4] bg-gray-800 rounded-lg overflow-hidden mb-6 border-2 border-primary">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-2" />
              <span className="text-white font-medium">Analisando Carta...</span>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full max-w-md aspect-[3/4] bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center mb-6">
          <span className="text-gray-400">Nenhuma imagem selecionada</span>
        </div>
      )}

      <button
        onClick={triggerCamera}
        disabled={loading}
        className="flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-white font-bold py-4 px-8 rounded-full text-lg shadow-lg transition-all active:scale-95 w-full max-w-xs"
      >
        <Camera className="w-6 h-6" />
        {preview ? 'Escanear Novamente' : 'Escanear Carta'}
      </button>
    </div>
  );
};

export default CardScanner;
