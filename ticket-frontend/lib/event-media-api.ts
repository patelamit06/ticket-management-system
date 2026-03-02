import { clearToken, getToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface EventMediaPayload {
  id: string;
  eventId: string;
  type: string;
  url: string;
  caption: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventMediaVideoBody {
  type: 'video';
  url: string;
  caption?: string;
}

/** Get presigned PUT URL, upload file to MinIO, then create media record. No file goes through our API. */
export async function uploadEventMedia(
  eventId: string,
  file: File,
  caption?: string
): Promise<EventMediaPayload> {
  const token = getToken();
  const contentType = file.type || 'image/jpeg';
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowed.includes(contentType)) {
    throw new Error('Invalid file type. Use JPEG, PNG, GIF, or WebP.');
  }

  const presignedRes = await fetch(`${API_URL}/events/${eventId}/media/presigned-upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ contentType }),
    credentials: 'include',
  });
  if (!presignedRes.ok) {
    if (presignedRes.status === 401) {
      clearToken();
      throw new Error('Please log in again to upload images.');
    }
    const err = await presignedRes.json().catch(() => ({ message: presignedRes.statusText }));
    throw new Error((err as { message?: string }).message ?? 'Failed to get upload URL');
  }
  const { uploadUrl, objectKey } = (await presignedRes.json()) as {
    uploadUrl: string;
    objectKey: string;
    publicUrl: string;
  };

  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': contentType },
  });
  if (!putRes.ok) {
    throw new Error('Upload to storage failed');
  }

  const createRes = await fetch(`${API_URL}/events/${eventId}/media`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ type: 'image', objectKey, caption: caption || undefined }),
    credentials: 'include',
  });
  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({ message: createRes.statusText }));
    throw new Error((err as { message?: string }).message ?? 'Failed to add image');
  }
  return createRes.json() as Promise<EventMediaPayload>;
}

export async function addEventMediaVideo(
  eventId: string,
  body: CreateEventMediaVideoBody
): Promise<EventMediaPayload> {
  const token = getToken();
  const res = await fetch(`${API_URL}/events/${eventId}/media`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? 'Failed to add video');
  }
  return res.json() as Promise<EventMediaPayload>;
}

export async function getEventMedia(eventId: string): Promise<EventMediaPayload[]> {
  const token = getToken();
  const res = await fetch(`${API_URL}/events/${eventId}/media`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch media');
  return res.json() as Promise<EventMediaPayload[]>;
}

export async function getPublicEventMedia(eventId: string): Promise<EventMediaPayload[]> {
  const res = await fetch(
    `${API_URL}/events/${eventId}/media/public`,
    { credentials: 'include' }
  );
  if (!res.ok) throw new Error('Failed to fetch media');
  return res.json() as Promise<EventMediaPayload[]>;
}

export async function reorderEventMedia(
  eventId: string,
  mediaIds: string[]
): Promise<EventMediaPayload[]> {
  const token = getToken();
  const res = await fetch(`${API_URL}/events/${eventId}/media/reorder`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ mediaIds }),
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? 'Failed to reorder');
  }
  return res.json() as Promise<EventMediaPayload[]>;
}

export async function deleteEventMedia(
  eventId: string,
  mediaId: string
): Promise<void> {
  const token = getToken();
  const res = await fetch(`${API_URL}/events/${eventId}/media/${mediaId}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? 'Failed to delete');
  }
}
