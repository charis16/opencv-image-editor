/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cv: any;
  }
}
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Image as ImageIcon, Trash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ImageEditor() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [panelVisible, setPanelVisible] = useState(true);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const vh = window.innerHeight;
    const maxHeight = 0.6 * vh; // 60vh
    const visibleHandle = 32; // tinggi handle yg ingin ditampilkan
    setOffsetY(maxHeight - visibleHandle);
  }, []);

  useEffect(() => {
    const loadOpenCv = async () => {
      const script = document.createElement("script");
      script.src = "/libs/openCV.jsx";
      script.async = true;
      script.onload = () => {
        console.log("OpenCV loaded");
      };
      document.body.appendChild(script);
    };

    loadOpenCv();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setPanelVisible(true);
    };
    reader.readAsDataURL(file);
  };

  const applyFilters = useCallback(() => {
    if (!imageRef.current || !canvasRef.current || !window.cv) return;

    const img = imageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Pastikan ukuran canvas match dengan gambar
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const cv = window.cv;

    const src = cv.imread(img);
    const dst = new cv.Mat();

    // Apply brightness and contrast
    const alpha = contrast / 100;
    const beta = brightness - 100;
    src.convertTo(dst, -1, alpha, beta);

    // Convert to HSV for saturation adjustment
    const hsv = new cv.Mat();
    cv.cvtColor(dst, hsv, cv.COLOR_RGB2HSV);

    const channels = new cv.MatVector();
    cv.split(hsv, channels);

    const saturationChannel = channels.get(1);
    const saturationMat = new cv.Mat();
    saturationMat.create(
      saturationChannel.rows,
      saturationChannel.cols,
      saturationChannel.type(),
    );
    saturationMat.setTo(new cv.Scalar(saturation / 100));

    cv.multiply(saturationChannel, saturationMat, saturationChannel);
    channels.set(1, saturationChannel);

    cv.merge(channels, hsv);
    cv.cvtColor(hsv, dst, cv.COLOR_HSV2RGB);

    // Show result
    cv.imshow(canvas, dst);

    // Clean up
    src.delete();
    dst.delete();
    hsv.delete();
    saturationChannel.delete();
    saturationMat.delete();
    channels.delete();
  }, [brightness, contrast, saturation]);

  useEffect(() => {
    if (imageSrc) {
      applyFilters();
    }
  }, [brightness, contrast, saturation, imageSrc, applyFilters]);

  const handleReset = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = "adjusted-image.png";
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  return (
    <main className='flex flex-col min-h-screen'>
      <div className='w-full bg-white dark:bg-zinc-900 shadow-md px-4 py-6'>
        <h1 className='text-lg font-bold'>Image Adjustment Tool</h1>
      </div>

      <div className='flex-grow px-2 py-6 relative'>
        <AnimatePresence mode='wait'>
          {!imageSrc ? (
            <motion.div
              key='no-image'
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className='flex flex-col items-center justify-center text-center gap-4 text-zinc-500 h-full'>
              <ImageIcon className='size-20' />
              <p className='text-lg font-semibold'>No image selected</p>
            </motion.div>
          ) : (
            <motion.div
              key='image'
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className='relative w-full md:aspect-[3/4] rounded-lg overflow-hidden'>
              <Button
                variant='ghost'
                className='absolute top-2 right-2 z-10 bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-600 p-1 rounded-full shadow'
                size='icon'
                onClick={() => {
                  setImageSrc(null);
                  setPanelVisible(false);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}>
                <Trash className='w-4 h-4' />
              </Button>
              <canvas
                ref={canvasRef}
                className='w-full h-full object-cover'
              />
              <img
                ref={imageRef}
                src={imageSrc || ""}
                alt='hidden'
                className='hidden'
                onLoad={applyFilters}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {!imageSrc && (
          <div className='fixed bottom-0 inset-x-0 z-50 p-4 bg-white dark:bg-zinc-900 border-t max-w-md mx-auto'>
            <Input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              onChange={handleImageChange}
            />
          </div>
        )}

        {/* Bottom sheet panel */}
        {imageSrc && (
          <motion.div
            className='fixed bottom-0 inset-x-0 z-50 max-w-md mx-auto'
            drag='y'
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            animate={{ y: panelVisible ? 0 : offsetY }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <div
              className='mx-auto max-w-md rounded-t-lg shadow-lg bg-white dark:bg-zinc-900 border-t overflow-hidden'
              style={{
                paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)",
                maxHeight: "60vh",
              }}>
              {/* Handle tetap selalu di atas */}
              <div className='sticky top-0 bg-white dark:bg-zinc-900 z-10 py-2'>
                <div className='mx-auto h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-700' />
              </div>

              {/* Konten panel */}
              {panelVisible && (
                <div className='px-4 pb-4 space-y-3'>
                  <div>
                    <label className='text-xs font-medium'>Brightness</label>
                    <Slider
                      min={0}
                      max={200}
                      value={[brightness]}
                      onValueChange={([v]) => setBrightness(v)}
                    />
                  </div>
                  <div>
                    <label className='text-xs font-medium'>Contrast</label>
                    <Slider
                      min={0}
                      max={200}
                      value={[contrast]}
                      onValueChange={([v]) => setContrast(v)}
                    />
                  </div>
                  <div>
                    <label className='text-xs font-medium'>Saturation</label>
                    <Slider
                      min={0}
                      max={200}
                      value={[saturation]}
                      onValueChange={([v]) => setSaturation(v)}
                    />
                  </div>

                  <div className='flex gap-2 justify-between pt-4'>
                    <Button
                      variant='outline'
                      className='flex-1 shadow-sm'
                      onClick={handleReset}>
                      Reset
                    </Button>
                    <Button
                      className='flex-1 shadow-sm'
                      onClick={handleDownload}>
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
