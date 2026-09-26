"""
Devices API routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.schemas import DeviceConnectionCreate, DeviceConnectionUpdate, DeviceConnectionResponse
from app.services.device_service import DeviceService
from app.models import DeviceType

router = APIRouter()


@router.post("", response_model=DeviceConnectionResponse, status_code=status.HTTP_201_CREATED)
async def register_device(
    device_data: DeviceConnectionCreate,
    db: AsyncSession = Depends(get_db),
):
    """Register a new device connection."""
    device_service = DeviceService(db)
    device = await device_service.register_device(
        session_id=device_data.session_id,
        student_id=device_data.student_id,
        device_type=DeviceType(device_data.device_type),
        connection_id=device_data.connection_id,
    )
    return DeviceConnectionResponse.model_validate(device)


@router.get("/session/{session_id}", response_model=list[DeviceConnectionResponse])
async def get_session_devices(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get all devices for a session."""
    device_service = DeviceService(db)
    devices = await device_service.get_session_devices(session_id)
    return [DeviceConnectionResponse.model_validate(d) for d in devices]


@router.get("/session/{session_id}/check")
async def check_required_devices(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Check if all required devices are connected."""
    device_service = DeviceService(db)
    all_connected = await device_service.check_all_required_connected(session_id)
    return {"all_connected": all_connected}


@router.get("/session/{session_id}/type/{device_type}", response_model=DeviceConnectionResponse)
async def get_device_by_type(
    session_id: UUID,
    device_type: DeviceType,
    db: AsyncSession = Depends(get_db),
):
    """Get device connection by type."""
    device_service = DeviceService(db)
    device = await device_service.get_by_session_and_type(session_id, device_type)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return DeviceConnectionResponse.model_validate(device)


@router.patch("/{device_id}", response_model=DeviceConnectionResponse)
async def update_device(
    device_id: UUID,
    device_data: DeviceConnectionUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update device connection."""
    device_service = DeviceService(db)
    device = await device_service.update_device(device_id, device_data)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return DeviceConnectionResponse.model_validate(device)


@router.post("/{device_id}/heartbeat", response_model=DeviceConnectionResponse)
async def device_heartbeat(
    device_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Update device last seen timestamp."""
    device_service = DeviceService(db)
    device = await device_service.heartbeat(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return DeviceConnectionResponse.model_validate(device)


@router.post("/{device_id}/disconnect", response_model=DeviceConnectionResponse)
async def disconnect_device(
    device_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Mark device as disconnected."""
    device_service = DeviceService(db)
    device = await device_service.disconnect_device(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return DeviceConnectionResponse.model_validate(device)