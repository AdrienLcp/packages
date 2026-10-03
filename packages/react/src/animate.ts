import {
  type ComponentPropsWithoutRef,
  createElement,
  type ElementType,
  type ReactElement,
  useEffect,
  useEffectEvent,
  useRef,
  useState
} from 'react'

type Phase = 'shown' | 'exiting' | 'gone'

type AnimateOwnProps<Tag extends ElementType> = {
  /** The element rendered, a `div` by default. */
  as?: Tag
  /**
   * Shown while true. Turning false keeps the element rendered with
   * `data-exiting` until every transition and animation in it has ended.
   */
  isVisible: boolean
  /** Keep the element in the DOM, `hidden`, once it has left. */
  keepMounted?: boolean
  /** Called once the element has finished leaving. */
  onExited?: () => void
}

export type AnimateProps<Tag extends ElementType = 'div'> =
  AnimateOwnProps<Tag> &
    Omit<ComponentPropsWithoutRef<Tag>, keyof AnimateOwnProps<Tag> | 'hidden'>

const settleAnimations = (element: Element | null): Promise<unknown> =>
  Promise.allSettled(
    (element?.getAnimations({ subtree: true }) ?? []).map(
      (animation) => animation.finished
    )
  )

/**
 * Mounts and unmounts an element without cutting its exit short. The motion
 * is the stylesheet's: `@starting-style` for the entry, `[data-exiting]` for
 * the exit, the same hooks a react-aria overlay offers. The exit lasts as long
 * as the CSS says, so a reduced-motion zero duration leaves at once.
 */
export const Animate = <Tag extends ElementType = 'div'>({
  as,
  isVisible,
  keepMounted = false,
  onExited,
  ...elementProps
}: AnimateProps<Tag>): ReactElement | null => {
  const elementRef = useRef<Element>(null)
  const [phase, setPhase] = useState<Phase>(isVisible ? 'shown' : 'gone')

  if (isVisible && phase !== 'shown') {
    setPhase('shown')
  }

  if (!isVisible && phase === 'shown') {
    setPhase('exiting')
  }

  const finishExit = useEffectEvent(() => {
    setPhase('gone')
    onExited?.()
  })

  useEffect(() => {
    if (phase !== 'exiting') {
      return
    }

    let isInterrupted = false
    void settleAnimations(elementRef.current).then(() => {
      if (!isInterrupted) {
        finishExit()
      }
    })

    return () => {
      isInterrupted = true
    }
  }, [phase])

  if (phase === 'gone' && !keepMounted) {
    return null
  }

  return createElement(as ?? 'div', {
    ...elementProps,
    'data-exiting': phase === 'exiting' ? '' : undefined,
    hidden: phase === 'gone',
    ref: elementRef
  })
}
