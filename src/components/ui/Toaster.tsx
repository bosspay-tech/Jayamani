"use client";

import { Toaster as HotToaster } from "react-hot-toast";

export function Toaster() {
  return (
    <HotToaster
      position="top-center"
      toastOptions={{
        duration: 1400,
        style: {
          background: "#ffffff",
          color: "#1a1218",
          border: "1px solid #e7ddd3",
        },
      }}
    />
  );
}

