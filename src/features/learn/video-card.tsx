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
    <article className="group flex flex-col overflow-hidden rounded-[14px] border border-hairline bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-gold-deep hover:shadow-lift">
      <div className="relative aspect-video w-full overflow-hidden bg-ink">
        {playing ? (
          <iframe
            className="absolute inset-0 h-full w-full animate-tvfade"
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
            <span className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" />
            {/* gold play seal */}
            <span className="absolute top-1/2 left-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gold text-ink shadow-lamp transition-transform duration-200 group-hover:scale-110">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5.5v13l11-6.5z" />
              </svg>
            </span>
            {/* duration badge */}
            <span className="nums absolute right-3 bottom-3 rounded-full bg-ink/80 px-2 py-0.5 text-[12px] font-semibold text-on-dark">
              {formatDuration(video.durationSeconds)}
            </span>
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-[19px] leading-snug text-ink">{video.title}</h3>
        <p className="mt-1.5 text-[14px] leading-relaxed text-muted-ink">{video.description}</p>
        <div className="mt-4 flex items-center gap-2 border-t border-row-divider pt-3 text-[12px] text-faint">
          <Star8 size={11} className="text-gold-deep" />
          <span className="truncate">{video.channel}</span>
          <a
            href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto shrink-0 font-medium text-emerald hover:underline"
          >
            Sur YouTube
          </a>
        </div>
      </div>
    </article>
  );
}
