from typing import Dict, List
from fastapi import WebSocket
from datetime import datetime
import json
import logging
import asyncio

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Gerencia conexões WebSocket para chat em grupo"""
    
    def __init__(self, heartbeat_interval: int = 25):
        # Estrutura: {classroom_id: [(websocket, user_id, user_name), ...]}
        self.active_connections: Dict[int, List[tuple]] = {}
        self.heartbeat_tasks: Dict[WebSocket, asyncio.Task] = {}
        self.heartbeat_interval = heartbeat_interval
    
    async def _heartbeat_task(self, websocket: WebSocket):
        """Send ping every 25 seconds to keep connection alive"""
        try:
            while True:
                await asyncio.sleep(self.heartbeat_interval)
                try:
                    await websocket.send_json({"type": "ping"})
                except Exception as e:
                    logger.debug(f"Heartbeat send failed: {e}")
                    break
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.debug(f"Heartbeat task error: {e}")
    
    async def connect(self, websocket: WebSocket, classroom_id: int, user_id: int, user_name: str):
        """Conecta um novo usuário ao chat da sala"""
        await websocket.accept()
        
        if classroom_id not in self.active_connections:
            self.active_connections[classroom_id] = []
        
        self.active_connections[classroom_id].append((websocket, user_id, user_name))
        
        # Iniciar heartbeat task
        heartbeat_task = asyncio.create_task(self._heartbeat_task(websocket))
        self.heartbeat_tasks[websocket] = heartbeat_task
        
        logger.info(f"User {user_name} (ID: {user_id}) connected to classroom {classroom_id}")
        logger.info(f"Total connections in classroom {classroom_id}: {len(self.active_connections[classroom_id])}")
        
        # Notificar outros usuários que alguém entrou
        await self.broadcast_system_message(
            classroom_id,
            f"{user_name} entrou na sala",
            exclude_user_id=user_id
        )
    
    def disconnect(self, websocket: WebSocket, classroom_id: int):
        """Remove uma conexão"""
        # Cancelar heartbeat task
        if websocket in self.heartbeat_tasks:
            self.heartbeat_tasks[websocket].cancel()
            del self.heartbeat_tasks[websocket]
        
        if classroom_id in self.active_connections:
            # Encontrar e remover a conexão
            user_info = None
            for conn in self.active_connections[classroom_id]:
                if conn[0] == websocket:
                    user_info = conn
                    self.active_connections[classroom_id].remove(conn)
                    break
            
            # Se não há mais conexões, remover a sala
            if not self.active_connections[classroom_id]:
                del self.active_connections[classroom_id]
            
            if user_info:
                logger.info(f"User {user_info[2]} (ID: {user_info[1]}) disconnected from classroom {classroom_id}")
                return user_info[2]  # Retorna o nome do usuário
        
        return None
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Envia mensagem para um usuário específico"""
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
    
    async def broadcast(self, classroom_id: int, message_data: dict, exclude_user_id: int = None):
        """Envia mensagem para todos os usuários de uma sala"""
        if classroom_id not in self.active_connections:
            logger.warning(f"No active connections for classroom {classroom_id}")
            return
        
        disconnected = []
        message_json = json.dumps(message_data)
        
        for connection in self.active_connections[classroom_id]:
            websocket, user_id, user_name = connection
            
            # Pular o usuário que enviou (se especificado)
            if exclude_user_id and user_id == exclude_user_id:
                continue
            
            try:
                await websocket.send_text(message_json)
            except Exception as e:
                logger.error(f"Error broadcasting to user {user_name}: {e}")
                disconnected.append(connection)
        
        # Remover conexões que falharam
        for conn in disconnected:
            if conn in self.active_connections[classroom_id]:
                self.active_connections[classroom_id].remove(conn)
    
    async def broadcast_system_message(self, classroom_id: int, message: str, exclude_user_id: int = None):
        """Envia uma mensagem do sistema para todos os usuários"""
        await self.broadcast(
            classroom_id,
            {
                "type": "system",
                "content": message,
                "timestamp": datetime.utcnow().isoformat()
            },
            exclude_user_id
        )
    
    def get_classroom_users(self, classroom_id: int) -> List[dict]:
        """Retorna lista de usuários conectados em uma sala"""
        if classroom_id not in self.active_connections:
            return []
        
        return [
            {"user_id": user_id, "user_name": user_name}
            for _, user_id, user_name in self.active_connections[classroom_id]
        ]


# Instância global do gerenciador
manager = ConnectionManager()
