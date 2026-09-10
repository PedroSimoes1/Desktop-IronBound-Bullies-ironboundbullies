"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import type { Photo } from "@/lib/domain/photo";
import { focalToObjectPosition } from "@/lib/images/focal";
import { durations, mediaQueries } from "@/styles/tokens";
import styles from "./Hero.module.css";

/**
 * The cinematic homepage hero (brief sections 6 and 7).
 *
 * One dog at a time. Photographs crossfade; the active photograph drifts from
 * scale 1.00 to 1.04 over eight seconds. The text column never moves: name,
 * one verified descriptor, two CTAs, then the controls.
 *
 * Desktop: text column left, photograph right, full height. Near-square
 * posters are shown whole on the black stage; landscape frames are
 * cover-cropped on their desktop focal point.
 * Phones and tablets: photograph in a square frame (portrait focal point),
 * text below.
 *
 * Autoplay pauses on hover, while focus is inside the hero, while the tab is
 * hidden, and stops for good once the visitor takes control. Under
 * prefers-reduced-motion there is no drift and slides cut with a short fade.
 * Only the previous, current, and next photographs are in the DOM, so the
 * first paint downloads one image (priority) and the next loads quietly.
 */

export interface HeroSlide {
  slug: string;
  name: string;
  /** Verified descriptor such as "Exotic Bully · Chocolate Tri". Omitted when unknown. */
  descriptor?: string;
  photo: Photo;
}

interface HeroProps {
  slides: HeroSlide[];
}

const CONTAIN_BELOW_ASPECT = 1.15;

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(mediaQueries.reducedMotion);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(mediaQueries.reducedMotion).matches,
    () => false,
  );
}

function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

function usePageVisible(): boolean {
  return useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === "visible",
    () => true,
  );
}

export function Hero({ slides }: HeroProps) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [userControlled, setUserControlled] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const reducedMotion = useReducedMotion();
  const pageVisible = usePageVisible();
  const headingId = useId();
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const autoplaying = count > 1 && !userControlled && !userPaused && !hovering && !focusWithin && pageVisible;

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  const takeControl = useCallback(() => setUserControlled(true), []);

  // Advance on a timer while autoplaying. The timer is re-armed on every index change.
  useEffect(() => {
    if (!autoplaying) return;
    const timer = window.setTimeout(() => goTo(index + 1), durations.heroDwell);
    return () => window.clearTimeout(timer);
  }, [autoplaying, index, goTo]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      takeControl();
      goTo(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      takeControl();
      goTo(index - 1);
    }
  };

  const onPointerDown = (event: React.PointerEvent) => {
    pointerStart.current = { x: event.clientX, y: event.clientY };
  };

  const onPointerUp = (event: React.PointerEvent) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    // A horizontal swipe of at least 40px that is clearly more sideways than vertical.
    if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      takeControl();
      goTo(dx < 0 ? index + 1 : index - 1);
    }
  };

  const current = slides[index];
  // Previous stays mounted so it can fade out; next is mounted early so it is loaded before it is shown.
  const mounted = new Set([(index - 1 + count) % count, index, (index + 1) % count]);

  return (
    <section
      className={[styles.hero, reducedMotion ? styles.reducedMotion : ""].filter(Boolean).join(" ")}
      role="region"
      aria-roledescription="carousel"
      aria-labelledby={headingId}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusWithin(false);
      }}
    >
      <div className={styles.media} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => (pointerStart.current = null)}>
        {slides.map((slide, i) => {
          if (!mounted.has(i)) return null;
          const active = i === index;
          const landscape = slide.photo.width / slide.photo.height >= CONTAIN_BELOW_ASPECT;
          return (
            <div
              key={slide.slug}
              className={styles.slide}
              data-active={active || undefined}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}: ${slide.name}`}
              aria-hidden={!active}
              style={
                {
                  "--focal-landscape": focalToObjectPosition(slide.photo.focal),
                  "--focal-portrait": focalToObjectPosition(slide.photo.focalPortrait ?? slide.photo.focal),
                  "--desktop-fit": landscape ? "cover" : "contain",
                } as React.CSSProperties
              }
            >
              <Image
                src={slide.photo.src}
                alt={slide.photo.alt}
                fill
                sizes="(min-width: 1024px) 58vw, 100vw"
                priority={i === 0}
                placeholder={slide.photo.blurDataUrl ? "blur" : "empty"}
                blurDataURL={slide.photo.blurDataUrl}
                className={styles.image}
                draggable={false}
              />
            </div>
          );
        })}
      </div>

      <div className={styles.column}>
        {/* The live region stays mounted; only its content is re-keyed so the fade-in replays per dog. */}
        <div className={styles.copy} aria-live={autoplaying ? "off" : "polite"} aria-atomic="true">
          <div key={current.slug} className={styles.copyInner}>
            <h1 id={headingId} className={["display-hero", styles.name].join(" ")}>
              {current.name}
            </h1>
            {current.descriptor && <p className={["label", styles.descriptor].join(" ")}>{current.descriptor}</p>}
            <div className={styles.actions}>
              <Button href={`/dogs/${current.slug}`}>View profile</Button>
              <Button href="/available" variant="secondary">
                Available dogs
              </Button>
            </div>
          </div>
        </div>

        {count > 1 && (
          <div className={styles.controls}>
            <button
              type="button"
              className={styles.arrow}
              onClick={() => {
                takeControl();
                goTo(index - 1);
              }}
            >
              <span className={styles.chevronLeft} aria-hidden="true" />
              <span className="sr-only">Previous dog</span>
            </button>

            <ol className={styles.indicators} role="list">
              {slides.map((slide, i) => (
                <li key={slide.slug}>
                  <button
                    type="button"
                    className={styles.indicator}
                    aria-current={i === index ? "true" : undefined}
                    onClick={() => {
                      takeControl();
                      goTo(i);
                    }}
                  >
                    <span className="sr-only">
                      Show {slide.name}, {i + 1} of {count}
                    </span>
                  </button>
                </li>
              ))}
            </ol>

            <button
              type="button"
              className={styles.arrow}
              onClick={() => {
                takeControl();
                goTo(index + 1);
              }}
            >
              <span className={styles.chevronRight} aria-hidden="true" />
              <span className="sr-only">Next dog</span>
            </button>

            <button
              type="button"
              className={styles.playToggle}
              aria-pressed={userPaused || userControlled}
              onClick={() => {
                if (userControlled || userPaused) {
                  setUserControlled(false);
                  setUserPaused(false);
                } else {
                  setUserPaused(true);
                }
              }}
            >
              {userControlled || userPaused ? (
                <span className={styles.playIcon} aria-hidden="true" />
              ) : (
                <span className={styles.pauseIcon} aria-hidden="true" />
              )}
              <span className="sr-only">{userControlled || userPaused ? "Resume slideshow" : "Pause slideshow"}</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
