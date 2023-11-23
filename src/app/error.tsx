'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className='flex flex-col items-center justify-center gap-2 h-80vh'>
      <h2 className='text-xl sm:text-2xl font-bold mb-5'>Something went wrong!</h2>
      <span>
        <button
          onClick={
            () => reset()
          }
        >
          Try again
        </button>
      </span>
    </div>
  )
}