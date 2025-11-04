import { useState, useEffect } from 'react'

/**
 * Global hook that provides the current time and updates every second
 * @returns {Date} The current time that updates every second
 */
export function useTime(): Date {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return time
}

/**
 * Hook that calculates time remaining until a target date
 * @param targetDate - The target date to count down to
 * @returns {string} Formatted time remaining (e.g., "5m 30s")
 */
export function useTimeRemaining(
  targetDate: string | Date | null | undefined,
): string {
  const currentTime = useTime()

  if (!targetDate) return ''

  let target: Date

  // Handle direct unix timestamp (as number or numeric string), as in 1760769210266
  if (
    typeof targetDate === 'number' ||
    (typeof targetDate === 'string' &&
      /^\d+$/.test(targetDate) &&
      targetDate.length >= 12)
  ) {
    // treat as ms timestamp
    target = new Date(Number(targetDate))
  } else {
    // try parse as regular date string
    target = new Date(targetDate)
  }
  if (isNaN(target.getTime())) return ''

  const timeLeft = target.getTime() - currentTime.getTime()

  if (timeLeft <= 0) return '0m 0s'

  const hours = Math.floor(timeLeft / 3600000)
  const minutes = Math.floor((timeLeft % 3600000) / 60000)
  const seconds = Math.floor((timeLeft % 60000) / 1000)

  return hours > 0
    ? `${hours}h ${minutes}m ${seconds}s`
    : `${minutes}m ${seconds}s`
}

