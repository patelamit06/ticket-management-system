'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle2, ScanLine, XCircle } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface ScanResult {
  success: true;
  checkedInAt: string;
  attendeeName: string | null;
  attendeeEmail: string | null;
  ticketTypeName: string;
  eventName: string;
}

async function scanTicket(uniqueCode: string): Promise<ScanResult> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ticket_access_token') : null;
  const res = await fetch(`${API_URL}/check-in/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ uniqueCode }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? res.statusText);
  }
  return res.json() as Promise<ScanResult>;
}

type Status =
  | { type: 'idle' }
  | { type: 'scanning' }
  | { type: 'success'; result: ScanResult }
  | { type: 'error'; message: string };

export default function CheckInPage() {
  const params = useParams();
  const eventId = typeof params.id === 'string' ? params.id : '';

  const [status, setStatus] = React.useState<Status>({ type: 'idle' });
  const [manualCode, setManualCode] = React.useState('');
  const [cameraActive, setCameraActive] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const detectorRef = React.useRef<BarcodeDetector | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const stoppedRef = React.useRef(false);
  const processingRef = React.useRef(false);

  const stopCamera = React.useCallback(() => {
    stoppedRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  const handleScan = React.useCallback(async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed || processingRef.current) return;
    processingRef.current = true;
    setStatus({ type: 'scanning' });
    try {
      const result = await scanTicket(trimmed);
      setStatus({ type: 'success', result });
      stopCamera();
    } catch (e) {
      setStatus({ type: 'error', message: e instanceof Error ? e.message : 'Scan failed' });
      stopCamera();
    } finally {
      processingRef.current = false;
    }
  }, [stopCamera]);

  const startCamera = React.useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus({ type: 'error', message: 'Camera is not available in this browser. Use manual entry below.' });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      stoppedRef.current = false;
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      video.srcObject = stream;
      await video.play();
      setCameraActive(true);

      const hasDetector = 'BarcodeDetector' in window;
      if (hasDetector) {
        detectorRef.current = new BarcodeDetector({ formats: ['qr_code'] });
      }
      // iOS Safari has no BarcodeDetector — decode frames with jsQR instead.
      const jsQR = hasDetector ? null : (await import('jsqr')).default;
      let lastDecode = 0;

      const scan = async (now: number) => {
        if (stoppedRef.current) return;
        if (!videoRef.current || processingRef.current || videoRef.current.readyState < 2) {
          rafRef.current = requestAnimationFrame(scan);
          return;
        }
        try {
          if (detectorRef.current) {
            const codes = await detectorRef.current.detect(videoRef.current);
            if (codes.length > 0) {
              await handleScan(codes[0].rawValue);
              return;
            }
          } else if (jsQR && now - lastDecode > 200) {
            lastDecode = now;
            const v = videoRef.current;
            const canvas = (canvasRef.current ??= document.createElement('canvas'));
            canvas.width = v.videoWidth;
            canvas.height = v.videoHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx && canvas.width > 0) {
              ctx.drawImage(v, 0, 0);
              const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(img.data, img.width, img.height);
              if (code?.data) {
                await handleScan(code.data);
                return;
              }
            }
          }
        } catch {
          //
        }
        rafRef.current = requestAnimationFrame(scan);
      };
      rafRef.current = requestAnimationFrame(scan);
    } catch (e) {
      const name = e instanceof DOMException ? e.name : '';
      const message =
        name === 'NotAllowedError'
          ? 'Camera permission was denied. Allow camera access in your browser settings and try again.'
          : name === 'NotFoundError'
            ? 'No camera was found on this device. Use manual entry below.'
            : 'Camera access denied or unavailable. Use manual entry below.';
      setStatus({ type: 'error', message });
    }
  }, [handleScan]);

  React.useEffect(() => () => stopCamera(), [stopCamera]);

  const reset = () => {
    setStatus({ type: 'idle' });
    setManualCode('');
    processingRef.current = false;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
        <div className="mb-6">
          <Link
            href={`/dashboard/events/${eventId}`}
            className="text-sm text-primary hover:underline"
          >
            ← Back to event
          </Link>
          <h1 className="mt-2 font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <ScanLine className="h-6 w-6" aria-hidden />
            Check-in Scanner
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Scan a ticket QR code or enter the code manually to check in an attendee.
          </p>
        </div>

        {/* Result panel */}
        {status.type === 'success' && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-green-600" aria-hidden />
              <div>
                <p className="font-semibold text-green-800">Checked in!</p>
                {(status.result.attendeeName || status.result.attendeeEmail) && (
                  <p className="mt-1 text-sm text-green-700">
                    {status.result.attendeeName ?? status.result.attendeeEmail}
                  </p>
                )}
                <p className="mt-0.5 text-sm text-green-700">{status.result.ticketTypeName}</p>
                <p className="mt-0.5 text-xs text-green-600">
                  {new Date(status.result.checkedInAt).toLocaleString()}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={reset}
              className="mt-4 w-full rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              Scan next ticket
            </button>
          </div>
        )}

        {status.type === 'error' && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" aria-hidden />
              <p className="text-sm font-medium text-red-800">{status.message}</p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="mt-4 w-full rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        )}

        {status.type !== 'success' && (
          <>
            {/* Camera scanner */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold text-foreground mb-3">Camera Scanner</h2>
              {/* The video element stays mounted so the ref exists when the stream attaches. */}
              <div className={cameraActive ? '' : 'hidden'}>
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full rounded-lg bg-black"
                    autoPlay
                    playsInline
                    muted
                    style={{ maxHeight: 320 }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="h-48 w-48 max-h-full max-w-full rounded-2xl border-4 border-primary/70" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  Stop camera
                </button>
                {status.type === 'scanning' && (
                  <p className="mt-2 text-center text-xs text-muted-foreground animate-pulse">
                    Scanning…
                  </p>
                )}
              </div>
              {!cameraActive && (
                <button
                  type="button"
                  onClick={startCamera}
                  disabled={status.type === 'scanning'}
                  className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  Open camera
                </button>
              )}
            </div>

            {/* Manual entry */}
            <div className="mt-4 rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold text-foreground mb-3">Manual Entry</h2>
              <p className="text-xs text-muted-foreground mb-3">
                Type or paste the unique code from the ticket.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScan(manualCode)}
                  placeholder="Ticket unique code"
                  className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm font-mono"
                  disabled={status.type === 'scanning'}
                />
                <button
                  type="button"
                  onClick={() => handleScan(manualCode)}
                  disabled={!manualCode.trim() || status.type === 'scanning'}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  Check in
                </button>
              </div>
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
