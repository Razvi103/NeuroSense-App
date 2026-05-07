"use client";

import { useCallback, useState, useRef, type DragEvent } from "react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  accept?: string;
  onFile: (file: File) => void;
  className?: string;
  label?: string;
  description?: string;
}

export function FileDropzone({
  accept = ".edf",
  onFile,
  className,
  label = "Drop your .edf file here",
  description = "or click to browse",
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        setFileName(file.name);
        onFile(file);
      }
    },
    [onFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setFileName(file.name);
        onFile(file);
      }
    },
    [onFile],
  );

  return (
    <div
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 cursor-pointer",
        "transition-all duration-200",
        isDragging
          ? "border-text-primary bg-text-primary/5"
          : "border-border hover:border-text-muted bg-surface",
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-elevated border border-border">
        <svg
          className={cn(
            "h-6 w-6 transition-colors",
            isDragging ? "text-text-primary" : "text-text-muted",
          )}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
      </div>
      {fileName ? (
        <p className="text-sm font-medium text-text-primary font-heading">
          {fileName}
        </p>
      ) : (
        <>
          <p className="text-sm font-medium text-text-primary font-heading">
            {label}
          </p>
          <p className="mt-1 text-xs text-text-muted">{description}</p>
        </>
      )}
    </div>
  );
}
