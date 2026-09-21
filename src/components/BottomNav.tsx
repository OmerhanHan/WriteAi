'use client'
import { usePathname, useRouter } from 'next/navigation'
import styles from './BottomNav.module.css'

const tabs = [
  { href: '/app/home',    label: 'Home',    icon: '⌂' },
  { href: '/app/writing', label: 'Write',   icon: '✎' },
  { href: '/app/history', label: 'History', icon: '◷' },
  { href: '/app/profile', label: 'Profile', icon: '◉' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router   = useRouter()
  return (
    <nav className={styles.nav} role="navigation" aria-label="Main navigation">
      <div className={styles.inner}>
        {tabs.map(t => {
          const active = pathname.startsWith(t.href)
          return (
            <button
              key={t.href}
              id={`nav-${t.label.toLowerCase()}`}
              className={`${styles.tab} ${active ? styles.active : ''}`}
              onClick={() => router.push(t.href)}
              aria-label={t.label}
              aria-current={active ? 'page' : undefined}
            >
              <span style={{ fontSize: 22, lineHeight: 1 }}>{t.icon}</span>
              <span className={styles.label}>{t.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
