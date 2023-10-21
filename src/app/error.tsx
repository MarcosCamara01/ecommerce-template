'use client' // Error components must be Client Components

import { useEffect } from 'react'

import '@/styles/alert.css';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className='error-msg'>
      <h2>Something went wrong!</h2>
      <span>
        <button
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
        >
          Try again
        </button>
      </span>
    </div>
  )
}