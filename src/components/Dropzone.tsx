import { useRef } from "react";

export function Dropzone({
  value,
  onChange,
  label,
  hint,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onChange(url);
  }

  return (
    <div
      className="rounded-xl border border-dashed border-white/20 bg-white/5 p-6 md:p-10 text-center"
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
    >
      {value ? (
        <div className="mx-auto max-w-xl">
          <img
            src={value}
            alt="Selected"
            className="mx-auto aspect-video w-full rounded-md object-cover ring-1 ring-white/10"
          />
        </div>
      ) : (
        <div className="mx-auto max-w-xl">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v4h16v-4" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </div>
          <p className="text-cyan-300 font-medium">{label ?? "Click to upload or drag and drop"}</p>
          <p className="mt-1 text-sm text-slate-400">{hint ?? "PNG, JPG or WEBP"}</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={pick}
        className="hidden"
      />
    </div>
  );
}
