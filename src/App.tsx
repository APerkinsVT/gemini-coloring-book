import { useState } from "react";
import { Dropzone } from "./components/Dropzone";
import { ResultBlock, PaletteRow } from "./components/ResultBlock";

type GuidePoint = { label: string; text: string };

export default function App() {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");               // e.g., "F1"
  const [sketchUrl, setSketchUrl] = useState<string | null>(null);
  const [palette, setPalette] = useState<PaletteRow[]>([]);
  const [guide, setGuide] = useState<GuidePoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Simulate your existing convert() flow; just wire your current logic here.
  async function handleCreate() {
    if (!photoUrl) return;
    setIsLoading(true);

    // TODO: call your Gemini/processing service here.
    // The values below are placeholders to demonstrate layout.
    await new Promise((r) => setTimeout(r, 1200));
    setTitle("F1");
    setSketchUrl("/sample-sketch.png"); // serve a local asset or returned URL
    setGuide([
      { label: "Car Body (Base)", text: "Flat body fill; add light highlights." },
      { label: "Tires", text: "Use very dark grays; leave a crisp edge." },
      { label: "Deep Shadow", text: "Cast shadows under wings and sidepods." },
      { label: "Metal/Trim", text: "Light gray; keep reflections simple." },
      { label: "Track/Surface", text: "Mid gray; keep strokes consistent." },
    ]);
    setPalette([
      { swatch: "#181A1B", name: "Tire Black", realWorld: "Carbon Black", rgb: "24,26,27" },
      { swatch: "#B22E3E", name: "Car Body Red", realWorld: "Race Red", rgb: "178,46,62" },
      { swatch: "#8D8F94", name: "Metal Trim", realWorld: "Steel Gray", rgb: "141,143,148" },
      { swatch: "#CFCFD3", name: "Light Highlights", realWorld: "Cool White", rgb: "207,207,211" },
      { swatch: "#3B3F4A", name: "Track Shadow", realWorld: "Asphalt Gray", rgb: "59,63,74" },
      { swatch: "#7C838E", name: "Track Midtone", realWorld: "Medium Slate", rgb: "124,131,142" },
      { swatch: "#0A0D12", name: "Deep Accents", realWorld: "Onyx", rgb: "10,13,18" },
    ]);
    setIsLoading(false);
  }

  function handleDownload() {
    // TODO: use your existing PDF export. This is a stub.
    alert("Wire this to your PDF generator/export.");
  }

  return (
    <main className="min-h-screen bg-[#0f1a2a] text-slate-100">
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-500">
            Gemini Color by Number Generator
          </h1>
          <p className="mt-2 text-slate-300">
            Turn any photo into a relaxing color-by-number activity. Upload an image and let Gemini
            create a numbered line drawing and matching color palette.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4">
        {!sketchUrl ? (
          // BEFORE STATE
          <div className="py-10 md:py-16">
            <Dropzone
              value={photoUrl}
              onChange={setPhotoUrl}
              label="Click to upload or drag and drop"
              hint="PNG, JPG or WEBP"
            />

            <div className="mt-6 flex justify-center">
              <button
                onClick={handleCreate}
                disabled={!photoUrl || isLoading}
                className="px-6 py-3 rounded-md bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white font-medium disabled:opacity-40"
              >
                {isLoading ? "Creating…" : "Create Coloring Page"}
              </button>
            </div>
          </div>
        ) : (
          // AFTER STATE
          <div className="py-8 md:py-12 space-y-8">
            <div className="flex justify-center">
              <span className="inline-flex items-center rounded-full bg-white/5 border border-white/10 px-3 py-1 text-sm text-slate-300">
                {title}
              </span>
            </div>

            <ResultBlock
              sketchUrl={sketchUrl}
              originalUrl={photoUrl!}
              guide={guide}
              palette={palette}
              onDownload={handleDownload}
            />
          </div>
        )}
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-3xl px-4 py-8 text-sm text-slate-400 flex items-center justify-between">
          <span>© {new Date().getFullYear()} Gemini Coloring Book</span>
          <nav className="space-x-4">
            <a className="hover:text-slate-200" href="/privacy">Privacy</a>
            <a className="hover:text-slate-200" href="/terms">Terms</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
