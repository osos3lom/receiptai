"use client"

import React from "react"

interface WhatsAppFloatingCTAProps {
  phoneNumber?: string
  defaultMessage?: string
}

export default function WhatsAppFloatingCTA({
  phoneNumber = "966506542290",
  defaultMessage = "مرحباً أ. أسامة، اطلعت على Receipt AI وأرغب بالاستفسار عن أتمتة الفواتير وربط النظام لشركتنا.",
}: WhatsAppFloatingCTAProps) {
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultMessage)}`

  return (
    <aside
      aria-label="تواصل عبر واتساب"
      className="fixed bottom-6 left-6 z-50 flex items-center select-none"
    >
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="تواصل مع المهندس أسامة عالم عبر واتساب"
        title="تواصل مع المهندس أسامة عالم عبر واتساب"
        className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#25D366]/40"
      >
        {/* Animated Pulse Indicator */}
        <span className="absolute top-0 right-0 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-400 border-2 border-white shadow-xs"></span>
        </span>

        {/* Enlarged WhatsApp SVG Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-7 h-7 sm:w-8 sm:h-8"
        >
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.34C9.33 7.34 9 7.42 8.73 7.71C8.45 8.01 7.68 8.74 7.68 10.21C7.68 11.69 8.76 13.11 8.91 13.31C9.06 13.51 11 16.5 13.94 17.77C14.64 18.07 15.18 18.25 15.61 18.39C16.31 18.61 16.95 18.58 17.45 18.5C18.01 18.42 19.18 17.79 19.42 17.11C19.67 16.44 19.67 15.86 19.59 15.74C19.52 15.62 19.32 15.55 19.02 15.4C18.73 15.25 17.29 14.54 17.02 14.44C16.76 14.34 16.56 14.29 16.37 14.59C16.17 14.88 15.6 15.55 15.43 15.75C15.25 15.94 15.08 15.97 14.78 15.82C14.49 15.67 13.54 15.36 12.41 14.35C11.53 13.57 10.94 12.6 10.79 12.35C10.64 12.1 10.77 11.97 10.92 11.82C11.05 11.69 11.21 11.47 11.36 11.3C11.5 11.13 11.55 11.01 11.65 10.81C11.75 10.61 11.7 10.44 11.63 10.29C11.55 10.14 10.97 8.72 10.72 8.13C10.49 7.55 10.25 7.63 10.07 7.62C9.9 7.61 9.71 7.61 9.51 7.61L9.53 7.34Z" />
        </svg>
      </a>
    </aside>
  )
}
