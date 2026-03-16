// Animation Utilities
// Helper functions for smooth animations and transitions

/**
 * Fade in animation
 */
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3, ease: "ease-out" },
};

/**
 * Slide up animation
 */
export const slideUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: -20, opacity: 0 },
  transition: { duration: 0.3, ease: "ease-out" },
};

/**
 * Scale animation
 */
export const scaleIn = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
  transition: { duration: 0.2, ease: "ease-out" },
};

/**
 * Stagger children animations
 */
export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

/**
 * Spring animation for smooth interactions
 */
export const spring = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

/**
 * Hover transition classes
 */
export const hoverTransition = "transition-all duration-200 ease-in-out";

/**
 * Focus transition classes
 */
export const focusTransition = "transition-all duration-150 ease-out";

/**
 * Modal transition classes
 */
export const modalTransition = "transition-all duration-300 ease-in-out";

/**
 * Animation duration constants
 */
export const DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

/**
 * Animation easing functions
 */
export const EASING = {
  ease: "ease-in-out",
  in: "ease-in",
  out: "ease-out",
  bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  elastic: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
} as const;
