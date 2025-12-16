import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Swords, Shield, Sparkles, Star, Tag, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Card3D = ({ card, onClose }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  if (!card) return null;

  const handleSell = () => {
    onClose();
    navigate('/sell', { state: { card } });
  };

  const handleView3D = () => {
    onClose();
    navigate(`/card3d/${card.id}`, { state: { card } });
  };

  const getCardTypeColor = (type) => {
    if (type?.includes('Spell')) return 'from-teal-500 to-teal-700';
    if (type?.includes('Trap')) return 'from-pink-500 to-pink-700';
    if (type?.includes('Fusion')) return 'from-purple-500 to-purple-700';
    if (type?.includes('Synchro')) return 'from-gray-100 to-gray-300';
    if (type?.includes('Xyz')) return 'from-gray-800 to-black';
    if (type?.includes('Link')) return 'from-blue-500 to-blue-700';
    if (type?.includes('Ritual')) return 'from-blue-400 to-blue-600';
    return 'from-amber-600 to-amber-800'; // Normal/Effect Monster
  };

  const renderStars = (level) => {
    if (!level) return null;
    return (
      <div className="flex gap-0.5 justify-center">
        {[...Array(level)].map((_, i) => (
          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto pt-12 pb-20"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md perspective-1000"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 bg-gray-800 hover:bg-gray-700 p-2 rounded-full border border-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Card Container with 3D Effect */}
        <div className="card-3d group">
          <div className={`
            relative bg-gradient-to-br ${getCardTypeColor(card.type)} 
            rounded-xl overflow-hidden shadow-2xl
            transform transition-transform duration-500
            group-hover:rotate-y-6 group-hover:rotate-x-3
          `}>
            {/* Card Header */}
            <div className="p-3 bg-black/20">
              <h2 className="text-lg font-bold text-white truncate">{card.name}</h2>
              {card.attribute && (
                <span className="text-xs text-white/80">{card.attribute}</span>
              )}
            </div>

            {/* Card Image */}
            <div className="relative aspect-square mx-3 rounded-lg overflow-hidden border-2 border-black/30 shadow-inner">
              <img 
                src={card.card_images?.[0]?.image_url_cropped || card.card_images?.[0]?.image_url} 
                alt={card.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {/* Card Info */}
            <div className="p-3 bg-black/20">
              {/* Stars/Level */}
              {card.level && (
                <div className="mb-2">
                  {renderStars(card.level)}
                </div>
              )}

              {/* Type/Race */}
              <div className="flex flex-wrap gap-1 mb-2">
                <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded text-white/90">
                  {card.race}
                </span>
                <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded text-white/90">
                  {card.type}
                </span>
              </div>

              {/* Description */}
              <div className="bg-black/30 rounded p-2 max-h-32 overflow-y-auto">
                <p className="text-xs text-white/90 leading-relaxed">
                  {card.desc}
                </p>
              </div>

              {/* ATK/DEF for Monsters */}
              {(card.atk !== undefined || card.def !== undefined) && (
                <div className="flex justify-end gap-4 mt-3 text-sm font-bold text-white">
                  {card.atk !== undefined && (
                    <div className="flex items-center gap-1">
                      <Swords className="w-4 h-4 text-red-400" />
                      <span>{card.atk}</span>
                    </div>
                  )}
                  {card.def !== undefined && (
                    <div className="flex items-center gap-1">
                      <Shield className="w-4 h-4 text-blue-400" />
                      <span>{card.def}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Link Rating for Link Monsters */}
              {card.linkval && (
                <div className="flex justify-end mt-2">
                  <span className="text-sm font-bold text-white flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    Link-{card.linkval}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card Set Info */}
        {card.card_sets && card.card_sets.length > 0 && (
          <div className="mt-4 bg-gray-900/90 rounded-lg p-3 border border-gray-800">
            <h3 className="text-xs font-bold text-gray-400 mb-2">Sets</h3>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
              {card.card_sets.slice(0, 5).map((set, i) => (
                <span key={i} className="text-[10px] bg-gray-800 px-2 py-1 rounded text-gray-300">
                  {set.set_name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Price Info */}
        {card.card_prices && card.card_prices.length > 0 && (
          <div className="mt-2 bg-gray-900/90 rounded-lg p-3 border border-gray-800">
            <h3 className="text-xs font-bold text-gray-400 mb-2">Preços (USD)</h3>
            <div className="flex gap-4 text-xs">
              <div>
                <span className="text-gray-500">TCGPlayer: </span>
                <span className="text-green-400 font-bold">${card.card_prices[0].tcgplayer_price || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500">Cardmarket: </span>
                <span className="text-green-400 font-bold">${card.card_prices[0].cardmarket_price || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleView3D}
            className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm border border-gray-700"
          >
            <ExternalLink className="w-4 h-4" />
            Ver em 3D
          </button>
          {isAuthenticated && (
            <button
              onClick={handleSell}
              className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Tag className="w-4 h-4" />
              Vender
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Card3D;
