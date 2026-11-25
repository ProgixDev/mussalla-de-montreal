"use client";

import { useState } from "react";
import { Star8 } from "@/components/ui/star";
import { formatDuration, type LearnVideo } from "./videos";

/**
 * A video tile. Shows the YouTube thumbnail as a lightweight facade with a gold play
 * seal; the actual iframe (youtube-nocookie, privacy-first) loads only on click, so
 * the page stays fast and no YouTube cookies are set until the visitor chooses to
 * watch. The card is framed like a small niche — gold hairline, khatam attribution.
 */
export function VideoCard({ video }: { video: LearnVideo }) {
  const [playing, setPlaying] = useState(false);
  const thumb = `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;

  return (
    <article className="group border-gold/15 hover:border-gold/50 flex flex-col overflow-hidden rounded-[16px] border bg-white/[0.035] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)] transition-all duration-200 hover:-translate-y-1">
      <div className="bg-ink relative aspect-video w-full overflow-hidden">
        {playing ? (
          <iframe
            className="animate-tvfade absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
            title={video.title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Lire la vidéo : ${video.title}`}
            className="absolute inset-0 h-full w-full cursor-pointer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- external YouTube thumbnail, no next/image config needed */}
            <img
              src={thumb}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span className="from-ink/75 via-ink/10 absolute inset-0 bg-gradient-to-t to-transparent" />
            {/* gold play seal */}
            <span className="bg-gold text-ink shadow-lamp absolute top-1/2 left-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 5.5v13l11-6.5z" />
              </svg>
            </span>
            {/* duration badge */}
            <span className="nums bg-ink/80 text-on-dark absolute right-3 bottom-3 rounded-full px-2 py-0.5 text-[12px] font-semibold">
              {formatDuration(video.durationSeconds)}
            </span>
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-on-dark text-[19px] leading-snug">{video.title}</h3>
        <p className="text-on-dark-muted mt-1.5 text-[14px] leading-relaxed">{video.description}</p>
        <div className="text-on-dark-faint mt-4 flex items-center gap-2 border-t border-white/[0.07] pt-3 text-[12px]">
          <Star8 size={11} className="text-gold" />
          <span className="truncate">{video.channel}</span>
          <a
            href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-light ml-auto shrink-0 font-medium hover:underline"
          >
            Sur YouTube
          </a>
        </div>
      </div>
    </article>
  );
}
