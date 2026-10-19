import { Client } from '@stomp/stompjs'

const WS_BASE = import.meta.env.VITE_WS_BASE || 'ws://localhost:8080/ws-blueprints'

/**
 * Conecta al tópico de un plano (blueprints.{author}.{name}).
 * - onUpdate(bp): se llama con el plano completo cada vez que alguien dibuja.
 * - onStatus(connected): informa si la conexión está activa.
 */
export function connectBlueprint(author, name, onUpdate, onStatus = () => {}) {
  const client = new Client({
    brokerURL: WS_BASE,
    reconnectDelay: 1000,
    onConnect: () => {
      onStatus(true)
      client.subscribe(`/topic/blueprints.${author}.${name}`, (msg) => onUpdate(JSON.parse(msg.body)))
    },
    onWebSocketClose: () => onStatus(false),
    onStompError: (frame) => console.error('STOMP error', frame.headers['message']),
  })
  client.activate()

  return {
    sendPoint(point) {
      if (!client.connected) return false
      client.publish({ destination: '/app/draw', body: JSON.stringify({ author, name, point }) })
      return true
    },
    disconnect() {
      client.deactivate()
    },
  }
}
