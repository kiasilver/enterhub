"use client";

import { panelFill } from '@/components/SafeDashboard/theme';

import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider/ThemeProvider";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export interface TourStep {
  target: string;
  title: string;
  description: string;
  placement?: "top" | "bottom" | "left" | "right";
  offset?: { x?: number; y?: number };
}

export interface TourProps {
  steps: TourStep[];
  open?: boolean;
  onClose?: () => void;
  onFinish?: () => void;
  className?: string;
  maskClassName?: string;
  placement?: "top" | "bottom" | "left" | "right";
}

const ARROW_SIZE = 8;
const SPACING = 12;

export function Tour({
  steps,
  open = false,
  onClose,
  onFinish,
  className,
  placement: defaultPlacement = "bottom",
}: TourProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [currentStep, setCurrentStep] = React.useState(0);
  const [targetElement, setTargetElement] = React.useState<HTMLElement | null>(
    null
  );
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const cardRef = React.useRef<HTMLDivElement>(null);

  // Reset step when tour reopens
  React.useEffect(() => {
    if (open) setCurrentStep(0);
  }, [open]);

  const calculatePosition = React.useCallback(() => {
    if (!targetElement || !cardRef.current) return null;

    const targetRect = targetElement.getBoundingClientRect();
    const cardRect = cardRef.current.getBoundingClientRect();
    const placement = steps[currentStep].placement || defaultPlacement;
    const offset = steps[currentStep].offset || { x: 0, y: 0 };

    let top = 0;
    let left = 0;

    switch (placement) {
      case "top":
        top =
          targetRect.top -
          cardRect.height -
          SPACING -
          ARROW_SIZE +
          (offset.y || 0);
        left =
          targetRect.left +
          (targetRect.width - cardRect.width) / 2 +
          (offset.x || 0);
        break;
      case "bottom":
        top = targetRect.bottom + SPACING + ARROW_SIZE + (offset.y || 0);
        left =
          targetRect.left +
          (targetRect.width - cardRect.width) / 2 +
          (offset.x || 0);
        break;
      case "left":
        top =
          targetRect.top +
          (targetRect.height - cardRect.height) / 2 +
          (offset.y || 0);
        left =
          targetRect.left -
          cardRect.width -
          SPACING -
          ARROW_SIZE +
          (offset.x || 0);
        break;
      case "right":
        top =
          targetRect.top +
          (targetRect.height - cardRect.height) / 2 +
          (offset.y || 0);
        left = targetRect.right + SPACING + ARROW_SIZE + (offset.x || 0);
        break;
    }

    // Ensure the card stays within viewport bounds
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    top = Math.max(
      SPACING,
      Math.min(viewport.height - cardRect.height - SPACING, top)
    );
    left = Math.max(
      SPACING,
      Math.min(viewport.width - cardRect.width - SPACING, left)
    );

    return { top, left };
  }, [targetElement, currentStep, steps, defaultPlacement]);

  const updatePosition = React.useCallback(() => {
    const newPosition = calculatePosition();
    if (newPosition) {
      setPosition(newPosition);
    }
  }, [calculatePosition]);

  React.useEffect(() => {
    if (!open) return;

    const target = document.querySelector(
      steps[currentStep].target
    ) as HTMLElement;
    setTargetElement(target);

    if (target) {
      target.style.position = "relative";
      target.style.zIndex = "60";

      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }

    return () => {
      if (target) {
        target.style.position = "";
        target.style.zIndex = "";
      }
    };
  }, [open, currentStep, steps]);

  React.useEffect(() => {
    if (!targetElement) return;

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [targetElement, updatePosition]);

  if (!open) return null;

  const handleNext = () => {
    if (currentStep === steps.length - 1) {
      onFinish?.();
      return;
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose?.();
  };

  const placement = steps[currentStep].placement || defaultPlacement;

  /* ── Theme-aware colours ─────────────────────────────────────────── */
  const overlayBg = "rgba(0,0,0,0.55)";

  const cardBg = panelFill(isDark);
  const cardBorder = isDark
    ? "rgba(255,255,255,0.1)"
    : "rgba(0,0,0,0.1)";
  const cardShadow = isDark
    ? "0 20px 60px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3)"
    : "0 20px 60px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)";

  const textPri = isDark ? "#ffffff" : "#0a0a0a";
  const textSec = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)";
  const textMut = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)";

  const accentBg = isDark ? "rgba(var(--primary-rgb), 0.15)" : "rgba(var(--primary-rgb), 0.1)";
  const accent = "var(--primary)";

  const btnPrimaryBg = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const btnPrimaryHover = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.14)";
  const btnGhostHover = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  const arrowColor = cardBg;

  /* ── Arrow inline style ──────────────────────────────────────────── */
  const arrowStyle: React.CSSProperties = {
    position: "absolute",
    width: 0,
    height: 0,
    borderWidth: "8px",
    borderStyle: "solid",
    borderColor: "transparent",
    ...(placement === "top" && {
      bottom: -16,
      left: "50%",
      transform: "translateX(-50%)",
      borderTopColor: cardBg,
    }),
    ...(placement === "bottom" && {
      top: -16,
      left: "50%",
      transform: "translateX(-50%)",
      borderBottomColor: cardBg,
    }),
    ...(placement === "left" && {
      right: -16,
      top: "50%",
      transform: "translateY(-50%)",
      borderLeftColor: cardBg,
    }),
    ...(placement === "right" && {
      left: -16,
      top: "50%",
      transform: "translateY(-50%)",
      borderRightColor: cardBg,
    }),
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay with cutout */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50"
          >
            {/* Dark overlay with polygon cutout around target */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{
                opacity: 1,
                scale: 1,
                clipPath: targetElement
                  ? `
              polygon(
                0% 0%,
                  0% 100%,
                  ${targetElement.getBoundingClientRect().left - 8}px 100%,
                  ${targetElement.getBoundingClientRect().left - 8}px ${
                      targetElement.getBoundingClientRect().top - 8
                    }px,
                  ${targetElement.getBoundingClientRect().right + 8}px ${
                      targetElement.getBoundingClientRect().top - 8
                    }px,
                  ${targetElement.getBoundingClientRect().right + 8}px ${
                      targetElement.getBoundingClientRect().bottom + 8
                    }px,
                  ${targetElement.getBoundingClientRect().left - 8}px ${
                      targetElement.getBoundingClientRect().bottom + 8
                    }px,
                  ${targetElement.getBoundingClientRect().left - 8}px 100%,
                  100% 100%,
                  100% 0%
                )`
                  : "",
              }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 300,
                clipPath: { type: "spring", damping: 25, stiffness: 400 },
              }}
              className="absolute inset-0"
              style={{ background: overlayBg }}
            />
          </motion.div>

          {/* Tour card */}
          <motion.div
            ref={cardRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: 1,
              scale: 1,
              top: position.top,
              left: position.left,
            }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{
              type: "spring",
              damping: 20,
              stiffness: 300,
              opacity: { duration: 0.2 },
              top: { type: "spring", damping: 20, stiffness: 300 },
              left: { type: "spring", damping: 20, stiffness: 300 },
            }}
            className={cn("fixed z-[70] w-[320px]", className)}
          >
            {/* Arrow */}
            <div style={arrowStyle} />

            {/* Glass card */}
            <div
              style={{
                background: cardBg,
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: `1px solid ${cardBorder}`,
                borderRadius: "16px",
                boxShadow: cardShadow,
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px 10px",
                }}
              >
                {/* Step counter + accent dot */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: accent,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: textMut,
                      letterSpacing: "0.03em",
                    }}
                  >
                    Step {currentStep + 1} of {steps.length}
                  </span>
                </div>

                {/* Close button */}
                <button
                  onClick={handleClose}
                  style={{
                    width: 28,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                    border: "none",
                    background: "transparent",
                    color: textMut,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = btnGhostHover;
                    (e.currentTarget as HTMLElement).style.color = textPri;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = textMut;
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Content */}
              <div style={{ padding: "0 16px 14px" }}>
                <h4
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: textPri,
                    marginBottom: 6,
                    lineHeight: 1.3,
                  }}
                >
                  {steps[currentStep].title}
                </h4>
                <p
                  style={{
                    fontSize: 13,
                    lineHeight: 1.55,
                    color: textSec,
                    margin: 0,
                  }}
                >
                  {steps[currentStep].description}
                </p>
              </div>

              {/* Footer */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 16px 14px",
                  borderTop: `1px solid ${cardBorder}`,
                }}
              >
                {/* Previous button */}
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "6px 12px",
                    borderRadius: 10,
                    border: `1px solid ${cardBorder}`,
                    background: "transparent",
                    color: currentStep === 0 ? textMut : textSec,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: currentStep === 0 ? "not-allowed" : "pointer",
                    opacity: currentStep === 0 ? 0.5 : 1,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (currentStep > 0) {
                      (e.currentTarget as HTMLElement).style.background = btnGhostHover;
                      (e.currentTarget as HTMLElement).style.color = textPri;
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = currentStep === 0 ? textMut : textSec;
                  }}
                >
                  <ChevronLeft size={14} />
                  Previous
                </button>

                {/* Next / Finish button */}
                <button
                  onClick={handleNext}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "6px 14px",
                    borderRadius: 10,
                    border: "1px solid transparent",
                    background: btnPrimaryBg,
                    color: textPri,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = btnPrimaryHover;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = btnPrimaryBg;
                  }}
                >
                  {currentStep === steps.length - 1 ? (
                    "Finish"
                  ) : (
                    <>
                      Next
                      <ChevronRight size={14} />
                    </>
                  )}
                </button>
              </div>

              {/* Progress bar */}
              <div
                style={{
                  height: 3,
                  background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                  borderRadius: "0 0 16px 16px",
                  overflow: "hidden",
                }}
              >
                <motion.div
                  animate={{
                    width: `${((currentStep + 1) / steps.length) * 100}%`,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  style={{
                    height: "100%",
                    background: `linear-gradient(90deg, ${accent}, var(--primary-hover))`,
                    borderRadius: "0 0 16px 16px",
                  }}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
