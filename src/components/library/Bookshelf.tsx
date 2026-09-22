import type { ReactNode } from 'react'
import styles from './library.module.css'

type BookshelfProps = {
  label?: string
  children: ReactNode
}

export default function Bookshelf({ label, children }: BookshelfProps) {
  return (
    <div className={styles.shelfBlock}>
      {label && <p className={styles.shelfLabel}>{label}</p>}
      <div className={styles.shelf}>
        <div className={styles.shelfRow}>{children}</div>
        <div className={styles.shelfPlank} aria-hidden />
      </div>
    </div>
  )
}
