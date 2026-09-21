'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import styles from '../login/login.module.css'

export default function RegisterPage() {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { register } = useAuth()
  const router       = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (!name || !email || !password) { setError('Lütfen tüm alanları doldurun.'); return }
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalı.'); return }
    setLoading(true)
    try { await register(email, password, name); router.push('/app/home') }
    catch { setError('Kayıt başarısız.') }
    finally { setLoading(false) }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>✎</div>
          <span className={styles.logoTitle}>WriteAI</span>
          <span className={styles.logoSub}>Hesap Oluştur</span>
        </div>
        <hr className={styles.rule} />
        <form onSubmit={submit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="reg-name" className={styles.label}>Ad Soyad</label>
            <input id="reg-name" type="text" className={styles.input} placeholder="Adınız" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label htmlFor="reg-email" className={styles.label}>E-posta</label>
            <input id="reg-email" type="email" className={styles.input} placeholder="ornek@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label htmlFor="reg-password" className={styles.label}>Şifre</label>
            <input id="reg-password" type="password" className={styles.input} placeholder="En az 6 karakter" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button id="register-submit" type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <span className="spinner" /> : '→ Kayıt Ol'}
          </button>
        </form>
        <p className={styles.foot}>Zaten hesabın var mı? <Link href="/auth/login" id="go-login" className={styles.link}>Giriş yap</Link></p>
      </div>
    </div>
  )
}
