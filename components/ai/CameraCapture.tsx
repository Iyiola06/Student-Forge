'use client';

import React, { useState, useRef, useEffect } from 'react';

interface CameraCaptureProps {
    onCapture: (base64: string) => void;
    onCancel: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        async function startCamera() {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' },
                    audio: false
                });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("Camera error:", err);
                setError("Could not access camera. Please ensure permissions are granted.");
            }
        }
        startCamera();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0);
                // Using high quality for OCR
                const dataUrl = canvas.toDataURL('image/png', 1.0);
                onCapture(dataUrl);
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-2xl bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-800">

                {/* Viewfinder */}
                <div className="relative aspect-[3/4] md:aspect-video bg-black flex items-center justify-center overflow-hidden">
                    {error ? (
                        <div className="flex flex-col items-center p-12 text-center">
                            <span className="material-symbols-outlined text-rose-500 text-5xl mb-4">videocam_off</span>
                            <p className="text-white font-bold">{error}</p>
                            <button onClick={onCancel} className="mt-6 px-8 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all">Go Back</button>
                        </div>
                    ) : (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                            {/* Overlays for guiding the user */}
                            <div className="absolute inset-0 border-[20px] md:border-[40px] border-black/40 pointer-events-none">
                                <div className="w-full h-full border-2 border-white/20 rounded-2xl flex items-center justify-center">
                                    <div className="w-12 h-12 border-t-2 border-l-2 border-white/60 absolute top-4 left-4"></div>
                                    <div className="w-12 h-12 border-t-2 border-r-2 border-white/60 absolute top-4 right-4"></div>
                                    <div className="w-12 h-12 border-b-2 border-l-2 border-white/60 absolute bottom-4 left-4"></div>
                                    <div className="w-12 h-12 border-b-2 border-r-2 border-white/60 absolute bottom-4 right-4"></div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Controls */}
                <div className="p-8 bg-slate-900 flex items-center justify-between">
                    <button
                        onClick={onCancel}
                        className="w-14 h-14 rounded-full bg-white/5 text-white flex items-center justify-center hover:bg-white/10 transition-all active:scale-90"
                    >
                        <span className="material-symbols-outlined font-black">close</span>
                    </button>

                    <button
                        onClick={takePhoto}
                        disabled={!!error}
                        className="w-20 h-20 rounded-full bg-white p-1 shadow-2xl shadow-white/20 hover:scale-110 active:scale-90 transition-all"
                    >
                        <div className="w-full h-full rounded-full border-4 border-slate-900 flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                        </div>
                    </button>

                    <div className="w-14 h-14"></div> {/* Spacer for symmetry */}
                </div>

                <canvas ref={canvasRef} className="hidden" />
            </div>

            <p className="mt-8 text-slate-400 text-sm font-bold tracking-widest uppercase">Align your handwritten notes within the frame</p>
        </div>
    );
};

export default CameraCapture;
