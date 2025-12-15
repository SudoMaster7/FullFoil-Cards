import * as THREE from 'three'
import { useEffect, useRef, useState } from 'react'
import { Canvas, extend, useThree, useFrame } from '@react-three/fiber'
import { useGLTF, useTexture, Environment, Lightformer } from '@react-three/drei'
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier'
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'
import { useControls } from 'leva'
import { easing } from 'maath'

// --- CONFIGURAÇÃO DAS IMAGENS DO CARTÃO ---
// Importa as imagens da pasta assets
import cardImage from '../assets/badge.png'
import cardBackImage from '../assets/badge-back.jpg'

const CARD_IMAGE_URL = cardImage
const CARD_BACK_IMAGE_URL = cardBackImage
// -------------------------------------------

extend({ MeshLineGeometry, MeshLineMaterial })
useGLTF.preload('https://assets.vercel.com/image/upload/contentful/image/e5382hct74si/5huRVDzcoDwnbgrKUo1Lzs/53b6dd7d6b4ffcdbd338fa60265949e1/tag.glb')
useTexture.preload('https://assets.vercel.com/image/upload/contentful/image/e5382hct74si/SOT1hmCesOHxEYxL7vkoZ/c57b29c85912047c414311723320c16b/band.jpg')

export default function CardViewer() {
  const [zoom, setZoom] = useState(13)
  // Estado de inspeção: controla se estamos vendo os detalhes
  const [inspecting, setInspecting] = useState(false)
  
  return (
    <div className="app-container">
      {/* Barra lateral de zoom */}
      <div className="zoom-sidebar">
        <label className="zoom-label">🔍 Zoom</label>
        <input
          type="range"
          min="5"
          max="20"
          step="0.5"
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="zoom-slider"
          orient="vertical"
        />
        <span className="zoom-value">{zoom.toFixed(1)}x</span>
      </div>
      
      <div className="canvas-container">
        <Canvas camera={{ position: [0, 0, zoom], fov: 25 }}>
          <Scene zoom={zoom} inspecting={inspecting} />
        </Canvas>
      </div>

      {/* Botão de Ver Detalhes */}
      <div className="actions-container">
        <button 
          className="inspect-btn"
          onClick={() => setInspecting(!inspecting)}
        >
          {inspecting ? 'Voltar' : 'Ver Detalhes'}
        </button>
      </div>

      {/* Painel de Detalhes (aparece quando inspecting é true) */}
      <div className={`details-container ${inspecting ? 'visible' : ''}`}>
        <div className="card-header">
          <h1 className="card-title">Card</h1>
          <p className="card-subtitle">Edição Limitada - Desenvolvedor</p>
        </div>
        
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-value">99</span>
            <span className="stat-label">Coding</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">Legendary</span>
            <span className="stat-label">Rarity</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">Infinite</span>
            <span className="stat-label">Stamina</span>
          </div>
        </div>

        <p className="description">
          Este cartão exclusivo concede acesso total aos sistemas mais complexos. 
          Forjado nas chamas do deadline e temperado com café, é o item definitivo para qualquer colecionador de código.
        </p>
      </div>
    </div>
  )
}

function Scene({ zoom, inspecting }) {
  const { debug } = useControls({ debug: false })
  const { camera } = useThree()
  
  useEffect(() => {
    camera.position.z = zoom
    camera.updateProjectionMatrix()
  }, [zoom, camera])
  
  return (
    <>
      <ambientLight intensity={Math.PI} />
      <Physics debug={debug} interpolate gravity={[0, -40, 0]} timeStep={1 / 60}>
        <Band inspecting={inspecting} />
      </Physics>
      <Environment background blur={0.75}>
        <color attach="background" args={['black']} />
        <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
        <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
        <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
        <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
      </Environment>
    </>
  )
}

function Band({ maxSpeed = 50, minSpeed = 10, inspecting }) {
  const band = useRef(), fixed = useRef(), j1 = useRef(), j2 = useRef(), j3 = useRef(), card = useRef()
  const vec = new THREE.Vector3(), ang = new THREE.Vector3(), rot = new THREE.Vector3(), dir = new THREE.Vector3()
  const segmentProps = { type: 'dynamic', canSleep: true, colliders: false, angularDamping: 2, linearDamping: 2 }
  const { nodes, materials } = useGLTF('https://assets.vercel.com/image/upload/contentful/image/e5382hct74si/5huRVDzcoDwnbgrKUo1Lzs/53b6dd7d6b4ffcdbd338fa60265949e1/tag.glb')
  const texture = useTexture('https://assets.vercel.com/image/upload/contentful/image/e5382hct74si/SOT1hmCesOHxEYxL7vkoZ/c57b29c85912047c414311723320c16b/band.jpg')
  const cardTexture = useTexture(CARD_IMAGE_URL)
  const cardBackTexture = useTexture(CARD_BACK_IMAGE_URL)

  // Controles Visuais para Ajuste Fino
  const { textureScale, textureOffset, textureRotation } = useControls('Ajuste da Carta', {
    textureScale: { value: [1.92, 1.35], step: 0.01, label: 'Zoom (Scale)' },
    textureOffset: { value: [0.47, -0.16], step: 0.01, label: 'Posição (Offset)' },
    textureRotation: { value: -3.14, step: 0.01, min: -Math.PI, max: Math.PI, label: 'Rotação' }
  })

  useEffect(() => {
    if (cardTexture) {
      cardTexture.wrapS = cardTexture.wrapT = THREE.RepeatWrapping
      cardTexture.center.set(0.5, 0.5)
      cardTexture.flipY = true 
      cardTexture.repeat.set(textureScale[0] * -1, textureScale[1]) 
      cardTexture.offset.set(textureOffset[0], textureOffset[1])
      cardTexture.rotation = textureRotation
      cardTexture.needsUpdate = true
    }
  }, [cardTexture, textureScale, textureOffset, textureRotation])

  useEffect(() => {
    if (cardBackTexture) {
      cardBackTexture.wrapS = cardBackTexture.wrapT = THREE.ClampToEdgeWrapping
      cardBackTexture.center.set(0.5, 0.5)
      cardBackTexture.flipY = true
      cardBackTexture.repeat.set(1, 1)
      cardBackTexture.needsUpdate = true
    }
  }, [cardBackTexture])

  const { width, height } = useThree((state) => state.size)
  const [curve] = useState(() => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]))
  const [dragged, drag] = useState(false)
  const [hovered, hover] = useState(false)

  // Ref para posição suave no modo inspeção
  const smoothPos = useRef(new THREE.Vector3(2, 0, 0))

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1])
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.45, 0]])

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab'
      return () => void (document.body.style.cursor = 'auto')
    }
  }, [hovered, dragged])

  useFrame((state, delta) => {
    // LÓGICA DE MOVIMENTO
    if (inspecting) {
      // --- MODO INSPEÇÃO (Card flutua para a esquerda e fica reto) ---
      card.current?.wakeUp()
      
      // Posição alvo (X = -1.5 para dar espaço ao painel de detalhes)
      const targetPos = new THREE.Vector3(-1.5, 0, 0)
      easing.damp3(smoothPos.current, targetPos, 0.25, delta)
      card.current?.setNextKinematicTranslation({ 
        x: smoothPos.current.x, 
        y: smoothPos.current.y, 
        z: smoothPos.current.z 
      })

      // Rotação alvo (zera para ficar de frente)
      card.current?.setNextKinematicRotation({ x: 0, y: 0, z: 0, w: 1 })
      
    } else if (dragged) {
      // --- MODO ARRASTAR ---
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera)
      dir.copy(vec).sub(state.camera.position).normalize()
      vec.add(dir.multiplyScalar(state.camera.position.length()))
      ;[card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp())
      card.current?.setNextKinematicTranslation({ x: vec.x - dragged.x, y: vec.y - dragged.y, z: vec.z - dragged.z })
    }

    // LÓGICA DA CORDA
    if (fixed.current) {
      ;[j1, j2].forEach((ref) => {
        if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation())
        const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())))
        ref.current.lerped.lerp(ref.current.translation(), delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)))
      })
      curve.points[0].copy(j3.current.translation())
      curve.points[1].copy(j2.current.lerped)
      curve.points[2].copy(j1.current.lerped)
      curve.points[3].copy(fixed.current.translation())
      band.current.geometry.setPoints(curve.getPoints(32))
      
      // Inclina o cartão de volta para a tela quando não está arrastando ou inspecionando
      if (!inspecting) {
        ang.copy(card.current.angvel())
        rot.copy(card.current.rotation())
        card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z })
      }
    }

    // Atualiza a posição suave quando sai do modo inspeção
    if (!inspecting && card.current) {
      const pos = card.current.translation()
      smoothPos.current.set(pos.x, pos.y, pos.z)
    }
  })

  curve.curveType = 'chordal'
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        
        {/* RigidBody do CARD - muda tipo baseado em inspeção/arrastar */}
        <RigidBody 
          position={[2, 0, 0]} 
          ref={card} 
          {...segmentProps} 
          type={dragged || inspecting ? 'kinematicPosition' : 'dynamic'}
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e) => (e.target.releasePointerCapture(e.pointerId), drag(false))}
            onPointerDown={(e) => {
              if (inspecting) return // Não permite arrastar no modo inspeção
              e.target.setPointerCapture(e.pointerId)
              drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())))
            }}>
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial map={cardTexture} map-anisotropy={16} clearcoat={1} clearcoatRoughness={0.15} roughness={0.3} metalness={0.5} />
            </mesh>
            {/* VERSO DO CARTÃO */}
            <mesh position={[0, 0.52, -0.01]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[0.71, 1]} />
              <meshPhysicalMaterial map={cardBackTexture} map-anisotropy={16} clearcoat={1} clearcoatRoughness={0.15} roughness={0.3} metalness={0.5} />
            </mesh>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial color="white" depthTest={false} resolution={[width, height]} useMap map={texture} repeat={[-3, 1]} lineWidth={1} />
      </mesh>
    </>
  )
}
