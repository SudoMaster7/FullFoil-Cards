import api from './api';
import axios from 'axios';

// Fallback direto para a API do YGOProDeck caso o backend não esteja disponível
const ygoprodeckDirect = axios.create({
  baseURL: 'https://db.ygoprodeck.com/api/v7',
});

/**
 * Busca cartas através do backend Django (proxy para YGOProDeck API)
 * Se falhar, usa a API diretamente como fallback
 */
export const searchCards = async (query, options = {}) => {
  const params = {};
  
  if (query) {
    params.fname = query; // Fuzzy name search
  }
  
  if (options.type) {
    params.type = options.type;
  }
  
  if (options.attribute) {
    params.attribute = options.attribute;
  }
  
  if (options.race) {
    params.race = options.race;
  }
  
  if (options.archetype) {
    params.archetype = options.archetype;
  }

  const limit = options.limit || 30;

  try {
    const response = await api.get('/core/cards/', { params });
    const data = response.data.data || [];
    return data.slice(0, limit);
  } catch (error) {
    // Fallback: chama API diretamente se backend não responder
    console.log('Backend indisponível, usando API direta...');
    try {
      const response = await ygoprodeckDirect.get('/cardinfo.php', { params });
      const data = response.data.data || [];
      return data.slice(0, limit);
    } catch (err) {
      console.error('Erro na API direta:', err);
      return [];
    }
  }
};

export const getCardById = async (id) => {
  const response = await api.get(`/core/cards/${id}/`);
  return response.data.data?.[0] || response.data;
};

export const getArchetypes = async () => {
  try {
    const response = await api.get('/core/archetypes/');
    return response.data;
  } catch (error) {
    const response = await ygoprodeckDirect.get('/archetypes.php');
    return response.data;
  }
};

/**
 * Busca cartas populares para exibição inicial (amostra)
 */
export const getPopularCards = async () => {
  try {
    // Tenta buscar do backend
    const response = await api.get('/core/cards/', { 
      params: { fname: 'dragon' } 
    });
    const data = response.data.data || [];
    return data.slice(0, 20);
  } catch (error) {
    // Fallback: busca direto da API
    try {
      const response = await ygoprodeckDirect.get('/cardinfo.php', {
        params: { fname: 'dragon' }
      });
      const data = response.data.data || [];
      return data.slice(0, 20);
    } catch (err) {
      console.error('Erro ao buscar cartas populares:', err);
      return [];
    }
  }
};

export default { searchCards, getCardById, getArchetypes, getPopularCards };
