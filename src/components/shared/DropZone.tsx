import { useState, useRef, type DragEvent } from "react";
import { Upload } from "lucide-react";

interface DropZoneProps {
  accept: string;
  multiple?: boolean;
  label: string;
  sublabel?: string;
  onFiles: (files: File[]) => void;
}

export default function DropZone({ accept, multiple = true, label, sublabel, onFiles }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOut = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(files);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed cursor-pointer transition-all duration-200 p-12 md:p-16
        flex flex-col items-center justify-center gap-4 text-center
        ${isDragging
          ? "border-accent bg-accent/5"
          : "border-text-muted/30 hover:border-accent/40 hover:bg-bg-secondary/50"
        }
      `}
    >
      <Upload size={28} className="text-text-muted" />
      <div>
        <p className="text-base font-medium text-text-primary">{label}</p>
        {sublabel && <p className="text-sm text-text-secondary mt-1">{sublabel}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
