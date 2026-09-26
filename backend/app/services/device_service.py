"""
Device service for managing device connections.
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import DeviceConnection, DeviceType, ExamSession
from app.schemas import DeviceConnectionCreate, DeviceConnectionUpdate, DeviceConnectionResponse


class DeviceService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, device_id: UUID) -> Optional[DeviceConnection]:
        result = await self.db.execute(
            select(DeviceConnection).where(DeviceConnection.id == device_id)
        )
        return result.scalar_one_or_none()

    async def get_by_session(self, session_id: UUID) -> List[DeviceConnection]:
        result = await self.db.execute(
            select(DeviceConnection)
            .where(DeviceConnection.session_id == session_id)
            .order_by(DeviceConnection.created_at)
        )
        return result.scalars().all()

    async def get_by_session_and_type(
        self, session_id: UUID, device_type: DeviceType
    ) -> Optional[DeviceConnection]:
        result = await self.db.execute(
            select(DeviceConnection).where(
                DeviceConnection.session_id == session_id,
                DeviceConnection.device_type == device_type
            )
        )
        return result.scalar_one_or_none()

    async def register_device(
        self,
        session_id: UUID,
        student_id: UUID,
        device_type: DeviceType,
        connection_id: Optional[str] = None
    ) -> DeviceConnection:
        """Register a new device connection."""
        # Check if device already registered
        existing = await self.get_by_session_and_type(session_id, device_type)
        if existing:
            existing.connection_id = connection_id
            existing.status = "CONNECTING"
            existing.last_seen_at = datetime.utcnow()
            existing.updated_at = datetime.utcnow()
            await self.db.flush()
            return existing

        device = DeviceConnection(
            session_id=session_id,
            student_id=student_id,
            device_type=device_type,
            connection_id=connection_id,
            status="CONNECTING",
        )
        self.db.add(device)
        await self.db.flush()
        return device

    async def update_device(
        self, device_id: UUID, device_data: DeviceConnectionUpdate
    ) -> Optional[DeviceConnection]:
        device = await self.get_by_id(device_id)
        if not device:
            return None

        for field, value in device_data.model_dump(exclude_unset=True).items():
            if field == "metadata" and value:
                import json
                setattr(device, field, json.dumps(value))
            else:
                setattr(device, field, value)

        device.updated_at = datetime.utcnow()
        if device_data.status == "CONNECTED" and not device.connected_at:
            device.connected_at = datetime.utcnow()
        if device_data.status == "DISCONNECTED":
            device.disconnected_at = datetime.utcnow()
        
        await self.db.flush()
        return device

    async def heartbeat(self, device_id: UUID) -> Optional[DeviceConnection]:
        """Update device last seen timestamp."""
        device = await self.get_by_id(device_id)
        if device:
            device.last_seen_at = datetime.utcnow()
            device.updated_at = datetime.utcnow()
            await self.db.flush()
        return device

    async def disconnect_device(self, device_id: UUID) -> Optional[DeviceConnection]:
        """Mark device as disconnected."""
        device = await self.get_by_id(device_id)
        if device:
            device.status = "DISCONNECTED"
            device.disconnected_at = datetime.utcnow()
            device.updated_at = datetime.utcnow()
            await self.db.flush()
        return device

    async def get_session_devices(self, session_id: UUID) -> List[DeviceConnection]:
        return await self.get_by_session(session_id)

    async def check_all_required_connected(self, session_id: UUID) -> bool:
        """Check if all required devices are connected."""
        required_types = [DeviceType.LAPTOP_CAMERA, DeviceType.MICROPHONE]
        session = await self._get_session(session_id)
        if not session:
            return False
        
        exam = await self._get_exam(session.exam_id)
        if exam and exam.requires_secondary_device:
            required_types.append(DeviceType.MOBILE_CAMERA)

        devices = await self.get_by_session(session_id)
        connected_types = {d.device_type for d in devices if d.status == "CONNECTED"}
        
        return all(t in connected_types for t in required_types)

    async def _get_session(self, session_id: UUID) -> Optional[ExamSession]:
        from app.models import ExamSession
        result = await self.db.execute(
            select(ExamSession).where(ExamSession.id == session_id)
        )
        return result.scalar_one_or_none()

    async def _get_exam(self, exam_id: UUID):
        from app.models import Exam
        result = await self.db.execute(
            select(Exam).where(Exam.id == exam_id)
        )
        return result.scalar_one_or_none()