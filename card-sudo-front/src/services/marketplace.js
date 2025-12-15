import api from './api';

/**
 * Lista todos os anúncios ativos do marketplace
 */
export const getListings = async (filters = {}) => {
  const params = {};
  
  if (filters.cardName) params.card_name = filters.cardName;
  if (filters.minPrice) params.min_price = filters.minPrice;
  if (filters.maxPrice) params.max_price = filters.maxPrice;
  if (filters.condition) params.condition = filters.condition;
  
  const response = await api.get('/market/listings/', { params });
  return response.data;
};

/**
 * Lista meus anúncios
 */
export const getMyListings = async () => {
  const response = await api.get('/market/listings/my/');
  return response.data;
};

/**
 * Lista minhas compras (cartas que eu comprei)
 */
export const getMyPurchases = async () => {
  const response = await api.get('/market/listings/purchases/');
  return response.data;
};

/**
 * Cria um novo anúncio
 */
export const createListing = async (listingData) => {
  const response = await api.post('/market/listings/create/', listingData);
  return response.data;
};

/**
 * Busca detalhes de um anúncio
 */
export const getListing = async (id) => {
  const response = await api.get(`/market/listings/${id}/`);
  return response.data;
};

/**
 * Cancela um anúncio
 */
export const cancelListing = async (id) => {
  const response = await api.delete(`/market/listings/${id}/cancel/`);
  return response.data;
};

/**
 * Compra uma carta
 */
export const purchaseListing = async (listingId, quantity = 1) => {
  const response = await api.post('/market/purchase/', {
    listing_id: listingId,
    quantity
  });
  return response.data;
};

/**
 * Compra múltiplas cartas (carrinho)
 */
export const purchaseBatch = async (listingIds) => {
  const response = await api.post('/market/purchase/batch/', {
    listing_ids: listingIds
  });
  return response.data;
};

// =============== ENDEREÇOS ===============

/**
 * Lista endereços do usuário
 */
export const getAddresses = async () => {
  const response = await api.get('/market/addresses/');
  return response.data;
};

/**
 * Cria novo endereço
 */
export const createAddress = async (addressData) => {
  const response = await api.post('/market/addresses/create/', addressData);
  return response.data;
};

/**
 * Atualiza endereço
 */
export const updateAddress = async (id, addressData) => {
  const response = await api.put(`/market/addresses/${id}/`, addressData);
  return response.data;
};

/**
 * Remove endereço
 */
export const deleteAddress = async (id) => {
  const response = await api.delete(`/market/addresses/${id}/delete/`);
  return response.data;
};

/**
 * Define endereço como padrão
 */
export const setDefaultAddress = async (id) => {
  const response = await api.post(`/market/addresses/${id}/default/`);
  return response.data;
};

// =============== CHECKOUT E PEDIDOS ===============

/**
 * Realiza checkout (cria pedido a partir do carrinho)
 */
export const checkout = async (listingIds, addressId) => {
  const response = await api.post('/market/checkout/', {
    listing_ids: listingIds,
    address_id: addressId
  });
  return response.data;
};

/**
 * Lista pedidos do usuário (como comprador)
 */
export const getOrders = async () => {
  const response = await api.get('/market/orders/');
  return response.data;
};

/**
 * Busca detalhes de um pedido
 */
export const getOrder = async (id) => {
  const response = await api.get(`/market/orders/${id}/`);
  return response.data;
};

/**
 * Confirma recebimento de um item do pedido
 */
export const confirmReceived = async (itemId) => {
  const response = await api.post(`/market/orders/items/${itemId}/received/`);
  return response.data;
};

// =============== VENDAS ===============

/**
 * Lista vendas do usuário (como vendedor)
 */
export const getSales = async (status = null) => {
  const params = status ? { status } : {};
  const response = await api.get('/market/sales/', { params });
  return response.data;
};

/**
 * Marca item como enviado
 */
export const markShipped = async (itemId, trackingCode = '') => {
  const response = await api.post(`/market/sales/${itemId}/ship/`, {
    tracking_code: trackingCode
  });
  return response.data;
};

/**
 * Resumo de vendas
 */
export const getSalesSummary = async () => {
  const response = await api.get('/market/sales/summary/');
  return response.data;
};

/**
 * Condições disponíveis
 */
export const CONDITIONS = [
  { value: 'MINT', label: 'Mint (Perfeito)' },
  { value: 'NEAR_MINT', label: 'Near Mint' },
  { value: 'EXCELLENT', label: 'Excelente' },
  { value: 'GOOD', label: 'Bom' },
  { value: 'LIGHT_PLAYED', label: 'Levemente Jogado' },
  { value: 'PLAYED', label: 'Jogado' },
  { value: 'POOR', label: 'Ruim' },
];

export default {
  getListings,
  getMyListings,
  createListing,
  getListing,
  cancelListing,
  purchaseListing,
  purchaseBatch,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  checkout,
  getOrders,
  getOrder,
  confirmReceived,
  getSales,
  markShipped,
  getSalesSummary,
  CONDITIONS
};
