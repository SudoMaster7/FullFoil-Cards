import * as THREE from 'three'
import { useEffect, useRef, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useTexture, Text } from '@react-three/drei'
import { RigidBody, useRevoluteJoint } from '@react-three/rapier'

export default function Card({ textureUrl }) {
  const cardRef = useRef()
  const jointRef = useRef() // O ponto fixo onde a corda "segura"
  
  // Carrega a textura do crachá
  const texture = useTexture(textureUrl)
  texture.encoding = THREE.sRGBEncoding

  // Ponto fixo no espaço (simulando a mão ou pescoço segurando)
  const [fixedBody, setFixedBody] = useState(null)

  // Cria uma "junta" (joint) que conecta o cartão a um ponto fixo
  useRevoluteJoint(fixedBody, cardRef, [
    [0, 1, 0], // Ponto de ancoragem no corpo fixo
    [0, 1.4, 0], // Ponto de ancoragem no cartão (topo dele)
    [0, 0, 1] // Eixo de rotação
  ])

  // Lógica para arrastar com o mouse (simplificada para este exemplo)
  useFrame((state) => {
    if (fixedBody) {
      // Move o ponto fixo suavemente conforme o mouse se move
      // Isso cria o efeito de "puxar" o cartão
      const { x, y } = state.mouse
      const vec = new THREE.Vector3(x * 10, (y * 10) + 2, 0) 
      fixedBody.setNextKinematicTranslation(vec)
    }
  })

  return (
    <group>
      {/* 1. Um corpo invisível que serve de âncora (Kinematic) */}
      <RigidBody
        ref={setFixedBody}
        type="kinematicPosition" 
        position={[0, 5, 0]} 
        colliders={false}
      />

      {/* 2. O Cartão em si (Dynamic - sofre gravidade) */}
      <RigidBody
        ref={cardRef}
        position={[0, 0, 0]}
        type="dynamic"
        colliders="hull" // Cria colisão automática baseada na forma
        linearDamping={0.5}
        angularDamping={0.5}
      >
        {/* Geometria do Cartão */}
        <mesh>
          <boxGeometry args={[2.5, 3.5, 0.1]} /> {/* Largura, Altura, Profundidade */}
          <meshStandardMaterial 
            map={texture} 
            color="white" 
            roughness={0.3}
          />
        </mesh>

        {/* Exemplo de Texto 3D no cartão (Opcional) */}
        <Text
            position={[0, 0.5, 0.06]}
            fontSize={0.2}
            color="black"
            font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
        >
            SUDO
        </Text>
      </RigidBody>
    </group>
  )
}