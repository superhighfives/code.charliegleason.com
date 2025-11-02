import { useMount } from "ahooks";
import { AnimatePresence, motion } from "framer-motion";
import { type ReactNode, useState } from "react";

/**
 * A reusable component for animating between two icons with a smooth transition.
 * Uses framer-motion's AnimatePresence to fade and scale icons when swapping.
 *
 * @example
 * <IconSwapAnimation condition={copied}>
 *   <Check size={16} />
 *   <Copy size={16} />
 * </IconSwapAnimation>
 */
export default function IconSwapAnimation({
  condition,
  children,
}: {
  /** When true, shows first child; when false, shows second child */
  condition: boolean;
  /** Exactly two ReactNode children - [trueIcon, falseIcon] */
  children: [ReactNode, ReactNode];
}) {
  const [trueIcon, falseIcon] = children;
  const [animate, setAnimate] = useState(false);
  useMount(() => setAnimate(true));

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={condition ? "true" : "false"}
        initial={!animate ? false : { scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {condition ? trueIcon : falseIcon}
      </motion.div>
    </AnimatePresence>
  );
}
