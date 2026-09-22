import styles from './library.module.css'

export type BookTone = 'sage' | 'rose' | 'butter' | 'slate' | 'ink'

export type BookProps = {
  title: string
  author?: string
  tone?: BookTone
  height?: 'sm' | 'md' | 'lg'
  onClick?: () => void
}

export default function Book({
  title,
  author,
  tone = 'sage',
  height = 'md',
  onClick,
}: BookProps) {
  const className = `${styles.book} ${styles[`tone_${tone}`]} ${styles[`h_${height}`]}`
  const label = author ? `${title} — ${author}` : title
  const face = (
    <>
      <span className={styles.bookSpine} aria-hidden />
      <span className={styles.bookFace}>
        <span className={styles.bookTitle}>{title}</span>
        {author && <span className={styles.bookAuthor}>{author}</span>}
      </span>
    </>
  )

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick} aria-label={label}>
        {face}
      </button>
    )
  }

  return (
    <div className={className} aria-label={label}>
      {face}
    </div>
  )
}
