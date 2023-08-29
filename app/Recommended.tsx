'use client';
import { GetAnimeResponse } from '@/data/anime';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

enum KeyCodes {
  left = 'ArrowLeft',
  right = 'ArrowRight',
}
interface DisplayParams {
  shift: number;
  gap: number;
  screenElements: number;
}

const INITIAL_DISPLAY_PARAMS: DisplayParams = {
  shift: 0,
  gap: 0,
  screenElements: 1,
};

function calculateDisplayParams(root: HTMLElement): DisplayParams {
  let rootElBounds = root.getBoundingClientRect();

  let first: HTMLElement | null = root.querySelector(
    '[tabIndex]:first-of-type'
  );
  let second: HTMLElement | null = root.querySelector(
    '[tabIndex]:nth-of-type(2)'
  );
  if (!first || !second) {
    return INITIAL_DISPLAY_PARAMS;
  }
  let firstBounds = first.getBoundingClientRect();
  let secondBounds = second.getBoundingClientRect();

  let gap = secondBounds.left - firstBounds.right;
  let shift = firstBounds.width + gap;
  let screenElements = rootElBounds.width / shift;
  return { shift, gap, screenElements };
}

interface Props {
  data: GetAnimeResponse;
}
export default function Recommended(props: Props) {
  let ref = useRef<HTMLDivElement>(null);

  let [active, setActive] = useState(0);
  let [displayParams, setDisplayParams] = useState(INITIAL_DISPLAY_PARAMS);

  let translateX = useMemo(() => {
    if (active === 0) {
      return 0;
    }
    if (active > props.data.length - displayParams.screenElements) {
      let maxElementsShift = props.data.length - displayParams.screenElements;
      let partialItemShift =
        displayParams.shift * (displayParams.screenElements % 1.0);
      return (
        maxElementsShift * displayParams.shift +
        partialItemShift -
        displayParams.gap
      );
    }
    return active * displayParams.shift - displayParams.gap;
  }, [
    active,
    displayParams.gap,
    displayParams.screenElements,
    displayParams.shift,
    props.data.length,
  ]);

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    let rootElement = ref.current;

    let resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target instanceof HTMLElement) {
          let displayParams = calculateDisplayParams(entry.target);
          setDisplayParams(displayParams);
        }
      }
    });

    resizeObserver.observe(rootElement);

    return () => {
      resizeObserver.unobserve(rootElement);
    };
  }, []);

  useEffect(() => {
    function handler(event: KeyboardEvent) {
      if (!ref.current) {
        return;
      }
      switch (event.code) {
        case KeyCodes.left: {
          setActive((v) => Math.max(v - 1, 0));
          return;
        }
        case KeyCodes.right: {
          setActive((v) => Math.min(v + 1, props.data.length - 1));
          return;
        }
      }
    }
    window.addEventListener('keyup', handler);
    return () => {
      window.removeEventListener('keyup', handler);
    };
  }, [props.data.length]);

  let handleClickChange = useCallback((i: number) => {
    return () => {
      setActive(i);
    };
  }, []);

  return (
    <div
      className="absolute bottom-0 left-0 overflow-hidden h-[30vh] w-screen"
      ref={ref}
    >
      <div
        className="absolute bottom-2 left-2 h-full p-4 flex gap-8 motion-safe:transition-transform"
        style={{ transform: `translateX(-${translateX}px)` }}
      >
        {props.data.map((anime, i) => {
          return (
            <figure
              key={anime.id}
              className={`box-content relative h-full aspect-[3/4] group border-gray-950 border-2 ${
                active === i ? 'active' : ''
              }`}
              role="button"
              onClick={handleClickChange(i)}
              tabIndex={0}
            >
              <div
                className="bg-yellow-300 absolute top-0 left-0 w-full h-full"
                role="none"
              ></div>
              <div className="box-content absolute top-[-1px] left-[-1px] h-full w-full motion-safe:transition-transform will-change-transform  group-[.active]:translate-x-2 group-[.active]:-translate-y-2 group-hover:translate-x-1 group-hover:-translate-y-1 border-gray-950 border-2">
                <Image
                  className="absolute top-0 left-0 object-cover h-full w-full"
                  src={anime.cover}
                  width={400}
                  height={450}
                  alt={`${anime.title} cover`}
                />
                <figcaption
                  className="absolute bottom-0 left-0 w-full h-20 p-1 font-semibold opacity-95 text-ellipsis line-clamp-3"
                  style={{
                    backgroundColor: anime.color,
                    color: anime.invertedColor,
                  }}
                >
                  {anime.title}
                </figcaption>
              </div>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
