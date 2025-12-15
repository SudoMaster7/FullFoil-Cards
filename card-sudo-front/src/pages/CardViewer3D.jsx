import * as THREE from 'three'
import { useEffect, useRef, useState, Suspense } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Canvas, useFrame } from '@react-three/fiber'
import { useTexture, Html } from '@react-three/drei'
import { ArrowLeft, Tag, Swords, Shield, Star, Loader2, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// URLs do proxy no backend (resolve CORS)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const getCardImageUrl = (cardId) => `${API_BASE}/core/images/${cardId}/`
const CARD_BACK_URL = `${API_BASE}/core/images/back/`

export default function CardViewer3D() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  
  const card = location.state?.card
  
  // Usa o proxy do backend para evitar CORS
  const cardImageUrl = card?.id ? getCardImageUrl(card.id) : CARD_BACK_URL
  
  // Debug
  console.log('CardViewer3D - Card ID:', card?.id)
  console.log('CardViewer3D - Image URL:', cardImageUrl)

  const handleSell = () => {
    navigate('/sell', { state: { card } })
  }

  const getCardTypeColor = (type) => {
    if (type?.includes('Spell')) return 'from-teal-500 to-teal-700'
    if (type?.includes('Trap')) return 'from-pink-500 to-pink-700'
    if (type?.includes('Fusion')) return 'from-purple-500 to-purple-700'
    if (type?.includes('Synchro')) return 'from-gray-100 to-gray-300'
    if (type?.includes('Xyz')) return 'from-gray-800 to-black'
    if (type?.includes('Link')) return 'from-blue-500 to-blue-700'
    if (type?.includes('Ritual')) return 'from-blue-400 to-blue-600'
    return 'from-amber-600 to-amber-800'
  }

  const renderStars = (level) => {
    if (!level) return null
    return (
      <div className="flex gap-0.5 justify-center">
        {[...Array(Math.min(level, 12))].map((_, i) => (
          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
    )
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white">
        <p className="text-gray-400 mb-4">Carta não encontrada</p>
        <button
          onClick={() => navigate('/catalog')}
          className="bg-purple-600 px-4 py-2 rounded-lg"
        >
          Voltar ao Catálogo
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-800 hover:bg-gray-700 p-1.5 sm:p-2 rounded-lg border border-gray-700 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <h1 className="text-sm sm:text-lg font-bold truncate">{card.name}</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-8">
          
          {/* 3D Canvas Section */}
          <div className="bg-gray-900/50 rounded-xl sm:rounded-2xl border border-gray-800 overflow-hidden flex items-center justify-center">
            <div className="aspect-[3/4] max-h-[320px] sm:max-h-[500px] w-full relative flex items-center justify-center">
              <Canvas 
                camera={{ position: [0, 0, 4], fov: 50 }}
                gl={{ antialias: true, alpha: true }}
                style={{ width: '100%', height: '100%' }}
              >
                <Suspense fallback={<LoadingFallback />}>
                  <Scene cardImageUrl={cardImageUrl} />
                </Suspense>
              </Canvas>
              
              {/* Instruction */}
              <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs text-gray-500 bg-gray-900/80 px-2 sm:px-3 py-1 rounded-full">
                Arraste para girar
              </div>
            </div>
          </div>

          {/* Card Info Section */}
          <div className="space-y-3 sm:space-y-4">
            {/* Card Header */}
            <div className={`bg-gradient-to-br ${getCardTypeColor(card.type)} rounded-xl p-3 sm:p-4`}>
              <h2 className="text-lg sm:text-2xl font-bold mb-1 leading-tight">{card.name}</h2>
              <div className="flex items-center gap-2 text-white/80 flex-wrap">
                {card.attribute && (
                  <span className="text-xs sm:text-sm bg-black/20 px-2 py-0.5 rounded">{card.attribute}</span>
                )}
                {card.level && renderStars(card.level)}
              </div>
            </div>

            {/* Type/Race */}
            <div className="bg-gray-900/80 rounded-xl p-3 sm:p-4 border border-gray-800">
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                {card.race && (
                  <span className="text-xs sm:text-sm bg-gray-800 px-2 sm:px-3 py-1 rounded-lg">{card.race}</span>
                )}
                {card.type && (
                  <span className="text-xs sm:text-sm bg-gray-800 px-2 sm:px-3 py-1 rounded-lg">{card.type}</span>
                )}
              </div>

              {/* Description */}
              <div className="bg-gray-800/50 rounded-lg p-2 sm:p-3">
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  {card.desc || 'Sem descrição disponível.'}
                </p>
              </div>
            </div>

            {/* Stats */}
            {(card.atk !== undefined || card.def !== undefined || card.linkval) && (
              <div className="bg-gray-900/80 rounded-xl p-3 sm:p-4 border border-gray-800">
                <h3 className="text-[10px] sm:text-xs font-bold text-gray-400 mb-2 sm:mb-3 uppercase">Estatísticas</h3>
                <div className="flex gap-4 sm:gap-6">
                  {card.atk !== undefined && (
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Swords className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                      <div>
                        <span className="text-[10px] sm:text-xs text-gray-500">ATK</span>
                        <p className="text-base sm:text-xl font-bold">{card.atk}</p>
                      </div>
                    </div>
                  )}
                  {card.def !== undefined && (
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                      <div>
                        <span className="text-[10px] sm:text-xs text-gray-500">DEF</span>
                        <p className="text-base sm:text-xl font-bold">{card.def}</p>
                      </div>
                    </div>
                  )}
                  {card.linkval && (
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                      <div>
                        <span className="text-[10px] sm:text-xs text-gray-500">LINK</span>
                        <p className="text-base sm:text-xl font-bold">{card.linkval}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Prices */}
            {card.card_prices && card.card_prices.length > 0 && (
              <div className="bg-gray-900/80 rounded-xl p-3 sm:p-4 border border-gray-800">
                <h3 className="text-[10px] sm:text-xs font-bold text-gray-400 mb-2 sm:mb-3 uppercase">Preços de Referência (USD)</h3>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="bg-gray-800/50 p-2 sm:p-3 rounded-lg">
                    <span className="text-[10px] sm:text-xs text-gray-500 block">TCGPlayer</span>
                    <span className="text-sm sm:text-lg text-green-400 font-bold">
                      ${card.card_prices[0].tcgplayer_price || 'N/A'}
                    </span>
                  </div>
                  <div className="bg-gray-800/50 p-2 sm:p-3 rounded-lg">
                    <span className="text-[10px] sm:text-xs text-gray-500 block">Cardmarket</span>
                    <span className="text-sm sm:text-lg text-green-400 font-bold">
                      ${card.card_prices[0].cardmarket_price || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Sets */}
            {card.card_sets && card.card_sets.length > 0 && (
              <div className="bg-gray-900/80 rounded-xl p-3 sm:p-4 border border-gray-800">
                <h3 className="text-[10px] sm:text-xs font-bold text-gray-400 mb-2 sm:mb-3 uppercase">Sets</h3>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 max-h-20 sm:max-h-24 overflow-y-auto">
                  {card.card_sets.slice(0, 8).map((set, i) => (
                    <span key={i} className="text-[10px] sm:text-xs bg-gray-800 px-1.5 sm:px-2 py-1 rounded text-gray-300">
                      {set.set_name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button */}
            {isAuthenticated && (
              <button
                onClick={handleSell}
                className="w-full py-3 sm:py-4 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm sm:text-lg"
              >
                <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
                Vender esta Carta
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <Html center>
      <div className="flex flex-col items-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-2" />
        <span className="text-sm text-gray-400">Carregando...</span>
      </div>
    </Html>
  )
}

function Scene({ cardImageUrl }) {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} />
      
      <Card3DModel cardImageUrl={cardImageUrl} />
    </>
  )
}

function Card3DModel({ cardImageUrl }) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const rotationStart = useRef({ x: 0, y: 0 })
  
  // URL do verso da carta via proxy
  const cardBackUrl = CARD_BACK_URL
  
  // Carrega texturas
  const frontTexture = useTexture(cardImageUrl || cardBackUrl)
  const backTexture = useTexture(cardBackUrl)
  
  // Configurar texturas
  useEffect(() => {
    if (frontTexture) {
      frontTexture.colorSpace = THREE.SRGBColorSpace
      frontTexture.minFilter = THREE.LinearFilter
      frontTexture.magFilter = THREE.LinearFilter
    }
    if (backTexture) {
      backTexture.colorSpace = THREE.SRGBColorSpace
      backTexture.minFilter = THREE.LinearFilter
      backTexture.magFilter = THREE.LinearFilter
    }
  }, [frontTexture, backTexture])

  useEffect(() => {
    document.body.style.cursor = hovered ? (dragging ? 'grabbing' : 'grab') : 'auto'
    return () => { document.body.style.cursor = 'auto' }
  }, [hovered, dragging])

  useFrame((state, delta) => {
    if (!meshRef.current || dragging) return
    
    // Animação idle - leve oscilação
    meshRef.current.rotation.y += Math.sin(state.clock.elapsedTime * 0.5) * 0.001
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.03
  })

  const handlePointerDown = (e) => {
    e.stopPropagation()
    setDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY }
    rotationStart.current = { 
      x: meshRef.current?.rotation.x || 0, 
      y: meshRef.current?.rotation.y || 0 
    }
    e.target.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e) => {
    if (!dragging || !meshRef.current) return
    
    const deltaX = (e.clientX - dragStart.current.x) * 0.01
    const deltaY = (e.clientY - dragStart.current.y) * 0.01
    
    meshRef.current.rotation.y = rotationStart.current.y + deltaX
    meshRef.current.rotation.x = Math.max(-0.5, Math.min(0.5, rotationStart.current.x + deltaY))
  }

  const handlePointerUp = (e) => {
    setDragging(false)
    e.target.releasePointerCapture(e.pointerId)
  }

  // Proporção de carta Yu-Gi-Oh
  const cardWidth = 2
  const cardHeight = 2.9
  const cardThickness = 0.02

  return (
    <group
      ref={meshRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => { setHovered(false); setDragging(false) }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
    >
      {/* Frente da carta */}
      <mesh position={[0, 0, cardThickness / 2 + 0.001]}>
        <planeGeometry args={[cardWidth, cardHeight]} />
        <meshStandardMaterial 
          map={frontTexture} 
          side={THREE.FrontSide}
          metalness={0.1}
          roughness={0.4}
        />
      </mesh>
      
      {/* Verso da carta */}
      <mesh position={[0, 0, -cardThickness / 2 - 0.001]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[cardWidth, cardHeight]} />
        <meshStandardMaterial 
          map={backTexture} 
          side={THREE.FrontSide}
          metalness={0.1}
          roughness={0.4}
        />
      </mesh>
      
      {/* Borda/Espessura da carta */}
      <mesh>
        <boxGeometry args={[cardWidth, cardHeight, cardThickness]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
    </group>
  )
}

