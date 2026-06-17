import { useEffect, useState } from 'react'

interface CoverArtProps {
  src: string | null | undefined
  alt: string
  className?: string
  fallbackClassName?: string
}

const CoverArt = ({ src, alt, className, fallbackClassName }: CoverArtProps) => {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setHasError(false)
  }, [src])

  if (!src || hasError) {
    return (
      <div className={fallbackClassName ?? 'cover-placeholder'}>
        <span>{alt}</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  )
}

export default CoverArt
