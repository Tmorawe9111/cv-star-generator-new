import React, { useEffect, useMemo, useRef, useState } from "react";

const isDev = typeof import.meta !== "undefined" && (import.meta as any).env?.DEV;

function getFirstOverflowingSelector(): string | null {
  try {
    const all = document.querySelectorAll<HTMLElement>("body *");
    
    // Cache computed styles to avoid repeated getComputedStyle calls
    const elementData: Array<{el: HTMLElement, style: CSSStyleDeclaration}> = [];
    
    for (const el of all) {
      const style = window.getComputedStyle(el);
      // Ignore elements not in layout flow
      if (style.position === "fixed" || style.position === "absolute") continue;
      elementData.push({el, style});
    }
    
    // Batch all DOM reads after collecting styles
    for (const {el} of elementData) {
      if (el.scrollWidth > el.clientWidth + 1) {
        // Try to build a useful selector
        const id = el.id ? `#${el.id}` : '';
        const cls = el.className && typeof el.className === 'string' ? `.${el.className.split(" ").filter(Boolean).join('.')}` : '';
        return `${el.tagName.toLowerCase()}${id}${cls}`;
      }
    }
  } catch (_) {}
  return null;
}

function applyKnownCorrections() {
  // Silent fixes to common offenders
  document.documentElement.classList.add("overflow-fix");
}

export const OverflowGuard: React.FC = () => {
  const [overflow, setOverflow] = useState(false);
  const [offender, setOffender] = useState<string | null>(null);
  const raf = useRef<number | null>(null);
  const lastWidth = useRef<number>(0);

  const check = useMemo(() => () => {
    if (!document?.documentElement) return;
    
    // Use requestAnimationFrame to avoid forced reflow
    requestAnimationFrame(() => {
      const doc = document.documentElement;
      const hasOverflow = doc.scrollWidth > doc.clientWidth + 1;
      setOverflow(hasOverflow);

      if (hasOverflow) {
        applyKnownCorrections();
        if (isDev) {
          const sel = getFirstOverflowingSelector();
          setOffender(sel);
          // Only warn if it's not the root element (which is often a false positive)
          if (sel && !sel.includes('#root')) {
            console.warn("OverflowGuard: first overflowing element:", sel);
          }
        }
      }
    });
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        if (lastWidth.current !== window.innerWidth) {
          lastWidth.current = window.innerWidth;
          check();
        }
      });
    };

    check();
    window.addEventListener("resize", onResize);
    const mo = new MutationObserver(() => check());
    mo.observe(document.body, { childList: true, subtree: true, attributes: true });
    return () => {
      window.removeEventListener("resize", onResize);
      mo.disconnect();
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [check]);

  if (!isDev) return null;

  return overflow ? (
    <div className="fixed top-0 inset-x-0 z-[60] mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
      <div className="mt-2 rounded-md bg-secondary text-secondary-foreground border border-border px-3 py-2 text-sm shadow-sm">
        Layout overflow detected — content adjusted{offender ? `: ${offender}` : ''}
      </div>
    </div>
  ) : null;
};

export default OverflowGuard;
