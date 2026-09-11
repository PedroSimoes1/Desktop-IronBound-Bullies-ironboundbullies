"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import type { Photo } from "@/lib/domain/photo";
import { focalToObjectPosition } from "@/lib/images/focal";
import { durations, mediaQueries } from "@/styles/tokens";
import styles from "./Hero.module.css";

/**
 * The cinematic homepage hero (brief sections 6 and 7).
 *
 * THE DISSOLVE. Photographs are painted as a stack, oldest at the bottom. Every
 * photograph in the stack sits at full opacity; only the arriving one animates,
 * fading in over the top of the one it replaces. That is the whole trick, and
 * it is the difference between a dissolve and a flicker: when both photographs
 * animate at once they are each half transparent in the middle of the
 * transition, the black page shows through about a quarter of the way, and the
 * eye reads the dip as a flash. Holding the outgoing frame opaque underneath
 * makes the two always sum to exactly one.
 *
 * THE DRIFT. An arriving photograph starts fractionally large and soft and
 * settles over several seconds; a departing one drifts fractionally larger as
 * it goes. Both movements are under four percent, which is felt rather than
 * seen. Everything animates transform and opacity, which the compositor runs
 * off the main thread, so scrolling stays smooth while the hero moves.
 *
 * Interruptions are safe by construction. CSS transitions always start from the
 * value on screen right now, so a visitor clicking through four dogs in a
 * second gets four overlapping dissolves rather than four jumps.
 *
 * Desktop: text column left, photograph right, full height. Near-square posters
 * are shown whole on the black stage; landscape frames are cover-cropped on
 * their desktop focal point. Phones and tablets: photograph in a square frame
 * (portrait focal point), text below.
 *
 * Autoplay pauses on hover, while focus is inside the hero, and while the tab
 * is hidden. Navigating by hand restarts the timer rather than stopping it, so
 * the visitor gets a full viewing of the dog they chose; the pause control is
 * the way to stop it for good. Under prefers-reduced-motion the photographs
 * still cross-dissolve, briefly, but nothing moves, scales, or blurs.
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

/** A little past the dissolve, so a layer is only dropped once it is covered. */
const PRUNE_AFTER_MS = durations.heroTransition + 150;

/**
 * When the remaining photographs are fetched. Late enough that nothing competes
 * with the first paint, early enough that jumping to any dog from the
 * indicators never waits on the network.
 */
const PRELOAD_REST_AFTER_MS = 2500;

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

const noopSubscribe = () => () => {};

/**
 * False while the server renders and during the first client render, true
 * afterwards. The server therefore sends the markup for one photograph only:
 * the browser's preload scanner sees the hero image and nothing competing with
 * it, and the rest arrive once the page is interactive.
 */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
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

  /**
   * The paint order, oldest first. The dog on screen is the last entry; the one
   * it is replacing is the entry below it. Both stay painted until the dissolve
   * has finished.
   */
  const [stack, setStack] = useState<number[]>([0]);
  const [hovering, setHovering] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [preloadRest, setPreloadRest] = useState(false);
  const reducedMotion = useReducedMotion();
  const pageVisible = usePageVisible();
  const hydrated = useHydrated();
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const index = stack[stack.length - 1];
  const previousIndex = stack.length > 1 ? stack[stack.length - 2] : null;
  const autoplaying = count > 1 && !userPaused && !hovering && !focusWithin && pageVisible;

  /**
   * Hovering holds the carousel still, but only over the things a visitor is
   * about to click. The hero fills the window, so pausing on the whole of it
   * would mean a cursor resting anywhere on screen stops the photographs
   * changing and most visitors would never learn there is more than one dog.
   * Over the buttons and the controls it earns its keep: nothing moves out from
   * under the pointer on the way to a click.
   */
  const holdOnHover = {
    onMouseEnter: () => setHovering(true),
    onMouseLeave: () => setHovering(false),
  };

  const goTo = useCallback(
    (next: number) => {
      setStack((current) => {
        const target = ((next % count) + count) % count;
        if (current[current.length - 1] === target) return current;
        // A dog already in the stack moves to the top rather than appearing twice.
        return [...current.filter((i) => i !== target), target];
      });
    },
    [count],
  );

  // Advance on a timer. Navigating by hand changes the index, which clears this
  // timer and arms a fresh one: autoplay and the visitor never fight for a turn.
  useEffect(() => {
    if (!autoplaying) return;
    const timer = window.setTimeout(() => goTo(index + 1), durations.heroDwell);
    return () => window.clearTimeout(timer);
  }, [autoplaying, index, goTo]);

  // Once a dissolve has settled the layers beneath are covered by an opaque
  // photograph, so they are dropped: the DOM is left holding exactly one
  // photograph and one name. Rapid clicking simply delays this, which is why
  // several layers can coexist safely in the meantime.
  useEffect(() => {
    if (stack.length < 2) return;
    const timer = window.setTimeout(() => setStack((current) => current.slice(-1)), PRUNE_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [stack]);

  useEffect(() => {
    const timer = window.setTimeout(() => setPreloadRest(true), PRELOAD_REST_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(index - 1);
    }
  };

  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    pointerStart.current = { x: event.clientX, y: event.clientY };
    // Capture the pointer so the release is delivered here even when the finger
    // leaves the photograph, which is where most swipes end on a small screen.
    // Without this a swipe that runs off the frame is simply lost.
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* capture is a convenience; the swipe still works when it is refused */
    }
  };

  const onPointerUp = (event: React.PointerEvent<HTMLElement>) => {
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* never captured */
    }
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    // A horizontal swipe of at least 40px that is clearly more sideways than vertical.
    if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      goTo(dx < 0 ? index + 1 : index - 1);
    }
  };

  /**
   * Which photographs exist in the DOM. One before hydration so the largest
   * paint has no competition; the stack plus both neighbours immediately after,
   * so the next dissolve never waits on a download; all of them shortly
   * afterwards, so the indicators can jump anywhere without a blank frame.
   * Only the first carries `priority`; the rest are ordinary fetches.
   */
  const mounted = (() => {
    if (!hydrated) return new Set([index]);
    if (preloadRest) return new Set(slides.map((_, i) => i));
    return new Set([...stack, (index + 1) % count, (index - 1 + count) % count]);
  })();

  const current = slides[index];
  const previous = previousIndex !== null ? slides[previousIndex] : null;
  // Nothing to dissolve from on the first paint, so the copy is simply there.
  const firstPaint = stack.length === 1;

  return (
    <section
      className={[styles.hero, reducedMotion ? styles.reducedMotion : ""].filter(Boolean).join(" ")}
      data-bleed-top=""
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured dogs"
      onKeyDown={onKeyDown}
      onFocusCapture={(event) => {
        // Only a keyboard visitor holds the carousel still. Clicking an arrow
        // with a mouse also puts focus on it, and stopping the slideshow for the
        // rest of someone's visit because they pressed "next" once is precisely
        // the fight between autoplay and interaction we are trying to avoid.
        const target = event.target as HTMLElement;
        if (typeof target.matches === "function" && target.matches(":focus-visible")) setFocusWithin(true);
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusWithin(false);
      }}
    >
      <div className={styles.media} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => (pointerStart.current = null)}>
        {slides.map((slide, i) => {
          if (!mounted.has(i)) return null;
          const position = stack.indexOf(i);
          const painted = position !== -1;
          const layer = painted ? (position === stack.length - 1 ? "top" : "under") : undefined;
          const landscape = slide.photo.width / slide.photo.height >= CONTAIN_BELOW_ASPECT;
          return (
            <div
              key={slide.slug}
              className={styles.slide}
              data-layer={layer}
              // Marks this as a pure opacity change, which keeps a short fade
              // under prefers-reduced-motion instead of cutting (globals.css).
              data-dissolve=""
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}: ${slide.name}`}
              aria-hidden={layer !== "top"}
              style={
                {
                  // A contained photograph is not cropped, so a focal point would
                  // only shove it off centre and open an uneven band beside it.
                  "--focal-landscape": landscape ? focalToObjectPosition(slide.photo.focal) : "50% 50%",
                  "--focal-portrait": focalToObjectPosition(slide.photo.focalPortrait ?? slide.photo.focal),
                  "--desktop-fit": landscape ? "cover" : "contain",
                  zIndex: painted ? position + 1 : 0,
                } as React.CSSProperties
              }
            >
              <Image
                src={slide.photo.src}
                alt={slide.photo.alt}
                fill
                sizes="(min-width: 1024px) 62vw, 100vw"
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
        {/* The live region stays mounted; only its content is re-keyed, so a
            screen reader hears the new dog once rather than on every frame. */}
        <div className={styles.copy} aria-live={autoplaying ? "off" : "polite"} aria-atomic="true">
          {/* The name it is replacing leaves first, on its own timing, while the
              photograph underneath is still fully opaque. `inert` keeps its
              buttons out of the tab order and out of the accessibility tree. */}
          {previous && (
            <div
              key={`leaving-${previous.slug}`}
              className={[styles.copyInner, styles.copyLeaving].join(" ")}
              inert
              aria-hidden="true"
            >
              <p className={["display-hero", styles.name].join(" ")}>{previous.name}</p>
              <p className={["label", styles.descriptor].join(" ")}>{previous.descriptor ?? ""}</p>
              <div className={styles.actions}>
                <Button href={`/dogs/${previous.slug}`}>View profile</Button>
                <Button href="/available" variant="secondary">
                  Available dogs
                </Button>
              </div>
            </div>
          )}

          <div
            key={current.slug}
            className={[styles.copyInner, firstPaint ? "" : styles.copyArriving].filter(Boolean).join(" ")}
          >
            {/* The dog's name is the slide's label, not the page's heading: the
                page's h1 belongs to the kennel, and an h1 that changes every
                seven seconds would belong to no one. */}
            <p className={["display-hero", styles.name].join(" ")}>{current.name}</p>
            {/* Always rendered, empty when a dog has no verified descriptor, so
                the block keeps one height and the name never shifts between dogs. */}
            <p className={["label", styles.descriptor].join(" ")}>{current.descriptor ?? ""}</p>
            <div className={styles.actions} {...holdOnHover}>
              <Button href={`/dogs/${current.slug}`}>View profile</Button>
              <Button href="/available" variant="secondary">
                Available dogs
              </Button>
            </div>
          </div>
        </div>

        {count > 1 && (
          <div className={styles.controls} {...holdOnHover}>
            <button type="button" className={styles.arrow} onClick={() => goTo(index - 1)}>
              <span className={styles.chevronLeft} aria-hidden="true" />
              <span className="sr-only">Previous dog</span>
            </button>

            <ol className={styles.indicators} role="list">
              {slides.map((slide, i) => (
                <li key={slide.slug}>
                  <button type="button" className={styles.indicator} aria-current={i === index ? "true" : undefined} onClick={() => goTo(i)}>
                    <span className="sr-only">
                      Show {slide.name}, {i + 1} of {count}
                    </span>
                  </button>
                </li>
              ))}
            </ol>

            <button type="button" className={styles.arrow} onClick={() => goTo(index + 1)}>
              <span className={styles.chevronRight} aria-hidden="true" />
              <span className="sr-only">Next dog</span>
            </button>

            <button type="button" className={styles.playToggle} aria-pressed={userPaused} onClick={() => setUserPaused((paused) => !paused)}>
              {userPaused ? <span className={styles.playIcon} aria-hidden="true" /> : <span className={styles.pauseIcon} aria-hidden="true" />}
              <span className="sr-only">{userPaused ? "Resume slideshow" : "Pause slideshow"}</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
