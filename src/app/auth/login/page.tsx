'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import styles from './login.module.css'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { login }  = useAuth()
  const router     = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (!email || !password) { setError('Lütfen tüm alanları doldurun.'); return }
    setLoading(true)
    try { await login(email, password); router.push('/app/home') }
    catch { setError('Giriş başarısız.') }
    finally { setLoading(false) }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>✎</div>
          <span className={styles.logoTitle}>WriteAI</span>
          <span className={styles.logoSub}>English Writing Practice</span>
        </div>
        <hr className={styles.rule} />
        <form onSubmit={submit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="login-email" className={styles.label}>E-posta</label>
            <input id="login-email" type="email" className={styles.input} placeholder="ornek@email.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className={styles.field}>
            <label htmlFor="login-password" className={styles.label}>Şifre</label>
            <input id="login-password" type="password" className={styles.input} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button id="login-submit" type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <span className="spinner" /> : '→ Giriş Yap'}
          </button>
        </form>
        <p className={styles.foot}>Hesabın yok mu? <Link href="/auth/register" id="go-register" className={styles.link}>Kayıt ol</Link></p>
      </div>
    </div>
  )
}
