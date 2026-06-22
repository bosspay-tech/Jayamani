"use client";

import Image from "next/image";
import { Upload, X } from "lucide-react";
import { useRef, useState } from "react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error ?? "Upload failed.");
        return;
      }

      onChange(result.data.url);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        disabled={uploading}
        onChange={handleFileChange}
      />

      {value ? (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-muted">
          <div className="relative aspect-[4/3] w-full max-w-sm">
            <Image
              src={value}
              alt="Product preview"
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 320px"
            />
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-3 right-3 rounded-full bg-background/90 p-2 text-muted-foreground shadow transition hover:text-foreground"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full max-w-sm flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-10 transition hover:border-accent hover:bg-muted/70 disabled:opacity-60"
        >
          <Upload className="h-8 w-8 text-accent" />
          <span className="mt-3 text-sm font-medium text-foreground">
            {uploading ? "Uploading..." : "Click to upload product image"}
          </span>
          <span className="mt-1 text-xs text-muted-foreground">
            JPG, PNG, WEBP, or GIF up to 5 MB
          </span>
        </button>
      )}

      {value && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:border-accent disabled:opacity-60"
        >
          {uploading ? "Uploading..." : "Replace image"}
        </button>
      )}

      {error && (
        <p className="rounded-xl bg-rose/20 px-4 py-3 text-sm text-foreground">
          {error}
        </p>
      )}
    </div>
  );
}
