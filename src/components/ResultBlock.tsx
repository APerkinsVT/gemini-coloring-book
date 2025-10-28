export type PaletteRow = {
  swatch: string;
  name: string;
  realWorld: string;
  rgb: string; // "r,g,b"
};

export function ResultBlock({
  sketchUrl,
  originalUrl,
  guide,
  palette,
  onDownload,
}: {
  sketchUrl: string;
  originalUrl: string;
  guide: { label: string; text: string }[];
  palette: PaletteRow[];
  onDownload: () => void;
}) {
  return (
    <div className="space-y-8">
      {/* Sketch */}
      <div className="rounded-md bg-white/5 ring-1 ring-white/10 overflow-hidden">
        <img
          src={sketchUrl}
          alt="Generated line drawing"
          className="w-full"
        />
      </div>

      {/* Original */}
      <div className="text-center">
        <div className="text-slate-300 text-sm mb-2">Original Photo</div>
        <div className="mx-auto w-48 rounded-md overflow-hidden ring-1 ring-white/10">
          <img src={originalUrl} alt="Original" className="w-full h-auto object-cover" />
        </div>
      </div>

      {/* Guide */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-5">
        <h3 className="font-semibold text-slate-100 mb-3">Coloring Guide</h3>
        <ul className="space-y-2 text-sm text-slate-300">
          {guide.map((g, i) => (
            <li key={i}>
              <span className="font-medium text-slate-100">{g.label}:</span> {g.text}
            </li>
          ))}
        </ul>
      </div>

      {/* Palette table */}
      <div className="overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.04] text-slate-300">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Swatch</th>
              <th className="px-4 py-3 text-left font-medium">Pigment/Name</th>
              <th className="px-4 py-3 text-left font-medium">Real-World Color</th>
              <th className="px-4 py-3 text-left font-medium">RGB</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {palette.map((row, i) => (
              <tr key={i} className="hover:bg-white/[0.03]">
                <td className="px-4 py-3">
                  <div
                    className="h-6 w-6 rounded-md ring-1 ring-white/10"
                    style={{ backgroundColor: row.swatch }}
                    aria-label={`Color ${row.swatch}`}
                  />
                </td>
                <td className="px-4 py-3 text-slate-100">{row.name}</td>
                <td className="px-4 py-3">{row.realWorld}</td>
                <td className="px-4 py-3">{row.rgb}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Download */}
      <div className="flex justify-center">
        <button
          onClick={onDownload}
          className="inline-flex items-center rounded-md bg-emerald-500 px-6 py-3 font-medium text-white hover:bg-emerald-600"
        >
          Download PDF
        </button>
      </div>
    </div>
  );
}
