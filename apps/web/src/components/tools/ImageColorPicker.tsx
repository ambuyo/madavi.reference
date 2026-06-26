import { useState, useRef, useCallback, useEffect } from "react";

// ── Color conversion utilities ──────────────────────────────────────────────

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function rgbToHsl(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function rgbToHsv(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; v: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

// ── Color palette extraction via k-means on downscaled pixels ───────────────

function extractPalette(
  imageData: ImageData,
  count: number = 10,
): { r: number; g: number; b: number; hex: string }[] {
  const pixels: { r: number; g: number; b: number }[] = [];
  const data = imageData.data;
  // Sample every 4th pixel for performance
  for (let i = 0; i < data.length; i += 16) {
    pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
  }

  if (pixels.length <= count) {
    return pixels.map((p) => ({ ...p, hex: rgbToHex(p.r, p.g, p.b) }));
  }

  // Simple k-means clustering
  // Initialize centroids evenly across the pixel range
  const centroids: { r: number; g: number; b: number }[] = [];
  const step = Math.floor(pixels.length / count);
  for (let i = 0; i < count; i++) {
    centroids.push({ ...pixels[Math.min(i * step, pixels.length - 1)] });
  }

  // Run 5 iterations
  let finalClusters: { r: number; g: number; b: number }[][] = [];
  for (let iter = 0; iter < 5; iter++) {
    const clusters: { r: number; g: number; b: number }[][] = centroids.map(
      () => [],
    );

    for (const pixel of pixels) {
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let c = 0; c < centroids.length; c++) {
        const dr = pixel.r - centroids[c].r;
        const dg = pixel.g - centroids[c].g;
        const db = pixel.b - centroids[c].b;
        const dist = dr * dr + dg * dg + db * db;
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = c;
        }
      }
      clusters[bestIdx].push(pixel);
    }

    for (let c = 0; c < centroids.length; c++) {
      if (clusters[c].length === 0) continue;
      const avg = clusters[c].reduce(
        (acc, p) => {
          acc.r += p.r;
          acc.g += p.g;
          acc.b += p.b;
          return acc;
        },
        { r: 0, g: 0, b: 0 },
      );
      centroids[c] = {
        r: Math.round(avg.r / clusters[c].length),
        g: Math.round(avg.g / clusters[c].length),
        b: Math.round(avg.b / clusters[c].length),
      };
    }
    finalClusters = clusters;
  }

  // Sort by cluster size (most dominant colors first)
  const sorted = centroids
    .map((c, i) => ({
      color: { ...c, hex: rgbToHex(c.r, c.g, c.b) },
      size: finalClusters[i]?.length ?? 0,
    }))
    .sort((a, b) => b.size - a.size)
    .map((item) => item.color);

  return sorted;
}

// ── Main Component ──────────────────────────────────────────────────────────

interface PickedColor {
  r: number;
  g: number;
  b: number;
  hex: string;
  rgb: string;
  hsl: string;
  hsv: string;
}

type ColorFormat = "hex" | "rgb" | "hsl" | "hsv";

const FORMAT_LABELS: { value: ColorFormat; label: string }[] = [
  { value: "hex", label: "HEX" },
  { value: "rgb", label: "RGB" },
  { value: "hsl", label: "HSL" },
  { value: "hsv", label: "HSV" },
];

export default function ImageColorPicker() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [pickedColor, setPickedColor] = useState<PickedColor | null>(null);
  const [palette, setPalette] = useState<
    { r: number; g: number; b: number; hex: string }[]
  >([]);
  const [mousePos, setMousePos] = useState<{
    x: number;
    y: number;
    containerWidth: number;
    canvasHeight: number;
  } | null>(null);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [activeFormat, setActiveFormat] = useState<ColorFormat>("hex");
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const magnifierCanvasRef = useRef<HTMLCanvasElement>(null);

  // ── Load image into state ───────────────────────────────────────────────

  const loadImage = useCallback((src: string) => {
    setIsLoading(true);
    const img = new Image();
    // Only set crossOrigin for remote http/https URLs (needed for canvas getImageData).
    // Blob URLs (file upload / paste) are same-origin — crossOrigin breaks them.
    if (/^https?:\/\//.test(src)) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      setImage(img);
      setPickedColor(null);
      setPalette([]);
      setIsLoading(false);
    };
    img.onerror = () => {
      setUrlError("Failed to load image. Check the URL and try again.");
      setIsLoading(false);
    };
    img.src = src;
  }, []);

  // ── Draw image on canvas ────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    // Constrain canvas to container width, max 800px
    const maxWidth = Math.min(containerRef.current?.clientWidth ?? 800, 800);
    const scale = maxWidth / image.naturalWidth;
    canvas.width = maxWidth;
    canvas.height = image.naturalHeight * scale;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  }, [image]);

  // ── Handle canvas click — pick color ────────────────────────────────────

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let pixel: Uint8ClampedArray;
      try {
        pixel = ctx.getImageData(x, y, 1, 1).data;
      } catch {
        // Canvas is tainted (e.g. external image without CORS) — can't read pixels
        return;
      }
      const [r, g, b] = [pixel[0], pixel[1], pixel[2]];
      const hsl = rgbToHsl(r, g, b);
      const hsv = rgbToHsv(r, g, b);

      setPickedColor({
        r,
        g,
        b,
        hex: rgbToHex(r, g, b),
        rgb: `rgb(${r}, ${g}, ${b})`,
        hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
        hsv: `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`,
      });

      // Extract palette from scaled-down image
      const scaleDown = Math.max(1, Math.floor(canvas.width / 150));
      const smallCanvas = document.createElement("canvas");
      smallCanvas.width = Math.floor(canvas.width / scaleDown);
      smallCanvas.height = Math.floor(canvas.height / scaleDown);
      const smallCtx = smallCanvas.getContext("2d");
      if (smallCtx) {
        smallCtx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
        const imageData = smallCtx.getImageData(
          0,
          0,
          smallCanvas.width,
          smallCanvas.height,
        );
        const colors = extractPalette(imageData, 10);
        setPalette(colors);
      }
    },
    [],
  );

  // ── Handle mouse move for magnifier ────────────────────────────────────

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);

      setMousePos({
        x,
        y,
        containerWidth: containerRef.current?.clientWidth ?? 400,
        canvasHeight: canvasRef.current?.height ?? 400,
      });

      // Draw magnifier
      const magCanvas = magnifierCanvasRef.current;
      if (!magCanvas) return;

      const magSize = 120;
      const zoom = 8;
      const halfSample = magSize / zoom / 2;

      magCanvas.width = magSize;
      magCanvas.height = magSize;
      const magCtx = magCanvas.getContext("2d");
      if (!magCtx) return;

      magCtx.imageSmoothingEnabled = false;

      // Draw zoomed region
      const sx = Math.max(
        0,
        Math.min(x - halfSample, canvas.width - magSize / zoom),
      );
      const sy = Math.max(
        0,
        Math.min(y - halfSample, canvas.height - magSize / zoom),
      );

      magCtx.drawImage(
        canvas,
        sx,
        sy,
        magSize / zoom,
        magSize / zoom,
        0,
        0,
        magSize,
        magSize,
      );

      // Draw crosshair
      const cx = (x - sx) * zoom;
      const cy = (y - sy) * zoom;
      magCtx.strokeStyle = "white";
      magCtx.lineWidth = 1;
      magCtx.beginPath();
      magCtx.moveTo(cx, 0);
      magCtx.lineTo(cx, magSize);
      magCtx.moveTo(0, cy);
      magCtx.lineTo(magSize, cy);
      magCtx.stroke();

      // Crosshair shadow
      magCtx.strokeStyle = "rgba(0,0,0,0.6)";
      magCtx.lineWidth = 1;
      magCtx.beginPath();
      magCtx.moveTo(cx - 0.5, 0);
      magCtx.lineTo(cx - 0.5, magSize);
      magCtx.moveTo(0, cy - 0.5);
      magCtx.lineTo(magSize, cy - 0.5);
      magCtx.stroke();
    },
    [],
  );

  const handleMouseLeave = useCallback(() => {
    setMousePos(null);
  }, []);

  // ── File upload handlers ────────────────────────────────────────────────

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      loadImage(url);
    },
    [loadImage],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        loadImage(url);
      }
    },
    [loadImage],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  // ── Paste handler ───────────────────────────────────────────────────────

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const blob = item.getAsFile();
          if (blob) {
            const url = URL.createObjectURL(blob);
            loadImage(url);
          }
        }
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [loadImage]);

  // ── URL input handler ───────────────────────────────────────────────────

  const handleUrlSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setUrlError("");
      const trimmed = urlInput.trim();
      if (!trimmed) return;
      if (
        !/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(
          trimmed,
        )
      ) {
        // Try loading anyway — could be a data URL or redirect
      }
      loadImage(trimmed);
    },
    [urlInput, loadImage],
  );

  // ── Copy to clipboard ───────────────────────────────────────────────────

  const copyColor = useCallback(
    async (format: ColorFormat) => {
      if (!pickedColor) return;
      const value = pickedColor[format];
      try {
        await navigator.clipboard.writeText(value);
        setCopiedFormat(format);
        setTimeout(() => setCopiedFormat(null), 1500);
      } catch {
        // Fallback
        const textArea = document.createElement("textarea");
        textArea.value = value;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopiedFormat(format);
        setTimeout(() => setCopiedFormat(null), 1500);
      }
    },
    [pickedColor],
  );

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="w-full min-h-screen relative overflow-hidden bg-stone-50">
      {/* ── Main Content ────────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="text-center mb-10">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-accent-500/10 text-accent-600 mb-5 border border-accent-500/20">
            Free Online Tool
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display text-stone-900 tracking-tight text-balance leading-[1.1]">
            Image Color Picker
          </h1>
          <p className="mt-4 text-base sm:text-lg text-stone-500 max-w-2xl mx-auto text-balance leading-relaxed">
            Upload an image, click any pixel, and instantly get its color in
            HEX, RGB, HSL, and HSV. Everything happens in your browser — no data
            is ever uploaded.
          </p>
        </div>

        {/* ── Input Bar ──────────────────────────────────────────────── */}
        <div className="relative bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-accent-500 text-white font-semibold text-sm hover:bg-accent-400 transition-all duration-200 cursor-pointer shadow-lg shadow-accent-500/25 whitespace-nowrap"
            >
              <UploadIcon />
              Use Your Image
            </button>

            <form
              onSubmit={handleUrlSubmit}
              className="flex items-center gap-0 flex-1 w-full"
            >
              <input
                type="text"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setUrlError("");
                }}
                placeholder="Paste an image URL…"
                className="w-full px-4 py-3 rounded-l-xl bg-stone-50 border border-stone-200 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500/50"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-3 rounded-r-xl bg-stone-100 border border-l-0 border-stone-200 text-stone-600 text-sm font-semibold hover:bg-stone-200 transition-colors disabled:opacity-40 whitespace-nowrap"
              >
                {isLoading ? "Loading…" : "Load URL"}
              </button>
            </form>
          </div>

          {urlError && <p className="mt-3 text-red-500 text-sm">{urlError}</p>}

          <p className="mt-3 text-center text-xs text-stone-400">
            You can also{" "}
            <strong className="text-stone-600">paste from clipboard</strong> or{" "}
            <strong className="text-stone-600">drag & drop an image</strong>
          </p>
        </div>

        {/* ── Main Workspace ──────────────────────────────────────────── */}
        <div
          ref={containerRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative bg-white border rounded-2xl transition-all duration-300 shadow-sm overflow-hidden ${
            dragOver
              ? "border-accent-400/50 ring-2 ring-accent-400/30"
              : "border-stone-200"
          }`}
        >
          {!image && !isLoading && (
            <div className="text-center py-20 sm:py-24 px-4">
              <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center">
                <UploadIcon className="w-10 h-10 text-stone-400" />
              </div>
              <p className="text-stone-700 text-lg font-semibold">
                Drop an image here or use the buttons above
              </p>
              <p className="text-stone-400 text-sm mt-2">
                Supports JPG, PNG, GIF, WebP, SVG, BMP
              </p>
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl z-10 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-accent-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-stone-500 text-sm">Loading image…</span>
              </div>
            </div>
          )}

          {image && (
            <div className="relative group p-3 sm:p-4">
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="max-w-full rounded-xl cursor-crosshair block mx-auto"
              />

              {/* Magnifier */}
              {mousePos && (
                <div
                  className="pointer-events-none absolute z-20"
                  style={{
                    left: Math.min(
                      mousePos.x + 24,
                      mousePos.containerWidth - 148,
                    ),
                    top: Math.min(
                      mousePos.y - 148,
                      mousePos.canvasHeight - 148,
                    ),
                  }}
                >
                  <canvas
                    ref={magnifierCanvasRef}
                    className="rounded-full border-2 border-stone-900/20 shadow-lg"
                    style={{ width: 128, height: 128 }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {image && (
          <p className="text-center text-sm text-stone-400 mt-3">
            Click on the image to pick a color
          </p>
        )}

        {/* ── Picked Color ────────────────────────────────────────────── */}
        {pickedColor && (
          <div className="mt-6 bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Color swatch */}
              <div className="flex flex-col items-center gap-3 flex-shrink-0">
                <div
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl shadow-lg ring-1 ring-stone-900/10 transition-colors duration-150"
                  style={{
                    backgroundColor: pickedColor.hex,
                    boxShadow: `0 0 60px -10px ${pickedColor.hex}`,
                  }}
                />
                <span className="text-xs font-mono text-stone-500">
                  {pickedColor.hex}
                </span>
              </div>

              {/* Color values */}
              <div className="flex-1 w-full min-w-0">
                {/* Format pills */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {FORMAT_LABELS.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setActiveFormat(f.value)}
                      className={`px-4 py-2 text-sm rounded-xl font-semibold transition-all duration-200 ${
                        activeFormat === f.value
                          ? "bg-accent-500 text-white shadow-lg shadow-accent-500/30"
                          : "bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-700 border border-stone-200"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Active format — large code display */}
                <div className="flex items-center gap-3 mb-5">
                  <code className="flex-1 text-xl sm:text-2xl lg:text-3xl font-mono font-bold text-stone-900 bg-stone-50 rounded-xl px-5 py-4 select-all border border-stone-200 tracking-wide">
                    {pickedColor[activeFormat]}
                  </code>
                  <button
                    onClick={() => copyColor(activeFormat)}
                    className="flex-shrink-0 p-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-700 transition-all duration-200 border border-stone-200"
                    title="Copy to clipboard"
                  >
                    {copiedFormat === activeFormat ? (
                      <CheckIcon className="w-5 h-5 text-green-500" />
                    ) : (
                      <CopyIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* All formats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {FORMAT_LABELS.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => copyColor(f.value)}
                      className={`text-left p-3.5 rounded-xl border transition-all duration-200 ${
                        activeFormat === f.value
                          ? "border-accent-500/40 bg-accent-500/5"
                          : "border-stone-200 bg-stone-50 hover:border-stone-300 hover:bg-stone-100"
                      }`}
                    >
                      <span className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">
                        {f.label}
                      </span>
                      <span className="block text-sm font-mono text-stone-700 truncate">
                        {pickedColor[f.value]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Color Palette ───────────────────────────────────────────── */}
        {palette.length > 0 && (
          <div className="mt-6 bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <h2 className="text-base font-semibold text-stone-700 mb-5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-400" />
              Color Palette
              <span className="text-stone-400 font-normal text-sm ml-auto">
                click any color to select
              </span>
            </h2>
            <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
              {palette.map((color, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const hsl = rgbToHsl(color.r, color.g, color.b);
                    const hsv = rgbToHsv(color.r, color.g, color.b);
                    setPickedColor({
                      ...color,
                      hex: color.hex,
                      rgb: `rgb(${color.r}, ${color.g}, ${color.b})`,
                      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
                      hsv: `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`,
                    });
                  }}
                  className="group flex flex-col items-center gap-2.5 transition-all duration-200 hover:scale-110"
                  title={color.hex}
                >
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg"
                    style={{
                      backgroundColor: color.hex,
                      boxShadow: `0 0 30px -5px ${color.hex}80`,
                    }}
                  />
                  <span className="text-[10px] font-mono text-stone-400 group-hover:text-stone-600 transition-colors">
                    {color.hex}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── FAQ ─────────────────────────────────────────────────────── */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoCard
            title="How to pick a color from an image?"
            body="Upload an image using the button above, paste from your clipboard, drag & drop, or enter an image URL. Then click any pixel on the image to see its color code."
          />
          <InfoCard
            title="Is this tool free?"
            body="Yes! This tool is completely free to use. No registration required. All processing happens locally in your browser."
          />
          <InfoCard
            title="What color formats are supported?"
            body="The tool provides color codes in HEX, RGB, HSL, and HSV formats. Click any format tab to see the value and copy it with one click."
          />
          <InfoCard
            title="Is my image uploaded to a server?"
            body="No. Your image stays on your device. Everything is processed client-side using your browser's canvas API. No data is ever sent anywhere."
          />
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="p-5 rounded-xl bg-white border border-stone-200 hover:border-stone-300 hover:shadow-sm transition-all duration-300">
      <h3 className="font-semibold text-stone-900 mb-2">{title}</h3>
      <p className="text-sm text-stone-500 leading-relaxed">{body}</p>
    </div>
  );
}

// ── Icon components (inline SVGs) ──────────────────────────────────────────

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "w-5 h-5"}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
      />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "w-5 h-5"}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "w-5 h-5"}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
