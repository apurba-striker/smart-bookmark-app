'use client'

import { useEffect, useState, useRef, useOptimistic, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { signInWithGoogle, signOut } from './actions/auth'
import type { RealtimeChannel } from '@supabase/supabase-js'

type Bookmark = {
  id: string
  url: string
  title: string
  created_at: string
  user_id: string
}

function getDomain(url: string) {
  try { return new URL(url).hostname.replace('www.', '') }
  catch { return url }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)
  const formRef = useRef<HTMLFormElement>(null)
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()

  const [optimisticBookmarks, setOptimisticBookmarks] = useOptimistic(
    bookmarks,
    (state, val: { action: 'add' | 'delete'; bookmark?: Bookmark; id?: string }) => {
      if (val.action === 'add' && val.bookmark) return [val.bookmark, ...state]
      if (val.action === 'delete' && val.id) return state.filter(b => b.id !== val.id)
      return state
    }
  )

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) { setBookmarks([]); return }
    let channel: RealtimeChannel

    const setup = async () => {
      const { data, error } = await supabase
        .from('bookmarks').select('*')
        .eq('user_id', user.id).order('created_at', { ascending: false })
      if (!error) setBookmarks(data || [])

      channel = supabase.channel('bookmarks-channel')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'bookmarks', filter: `user_id=eq.${user.id}` },
          (payload) => {
            setBookmarks(prev => {
              if (prev.some(b => b.id === payload.new.id)) return prev
              return [payload.new as Bookmark, ...prev]
            })
          })
        .on('postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'bookmarks', filter: `user_id=eq.${user.id}` },
          (payload) => setBookmarks(prev => prev.filter(b => b.id !== payload.old.id)))
        .subscribe()
    }
    setup()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [user])

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const url = fd.get('url') as string
    const title = fd.get('title') as string
    if (!user) return

    const temp: Bookmark = { id: `temp-${Date.now()}`, url, title, created_at: new Date().toISOString(), user_id: user.id }
    startTransition(async () => {
      setOptimisticBookmarks({ action: 'add', bookmark: temp })
      const { error, data } = await supabase.from('bookmarks')
        .insert({ user_id: user.id, url, title }).select().single()
      if (error) {
        alert('Failed to add bookmark')
        setBookmarks(prev => prev.filter(b => b.id !== temp.id))
      } else {
        setBookmarks(prev => [data, ...prev.filter(b => b.id !== temp.id)])
        formRef.current?.reset()
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      setOptimisticBookmarks({ action: 'delete', id })
      const { error } = await supabase.from('bookmarks').delete().eq('id', id)
      if (error) {
        alert('Failed to delete bookmark')
        const { data } = await supabase.from('bookmarks').select('*')
          .eq('user_id', user.id).order('created_at', { ascending: false })
        if (data) setBookmarks(data)
      } else {
        setBookmarks(prev => prev.filter(b => b.id !== id))
      }
    })
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    )
  }

  /* ── Main ── */
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '3rem 1rem 5rem' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>

        {/* ── Wordmark ── */}
        <header style={{ marginBottom: '2.5rem' }}>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.5rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            margin: 0,
          }}>
            Bookmarks
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {user ? `${optimisticBookmarks.length} saved` : 'Your personal reading list'}
          </p>
        </header>

        {/* ── Auth / Form card ── */}
        <div className="card" style={{ padding: '1.75rem', marginBottom: '1.25rem' }}>

          {!user ? (
            /* Sign-in */
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                Sign in to save and sync your bookmarks across devices.
              </p>
              <form action={signInWithGoogle}>
                <button type="submit" className="btn-ghost" style={{ width: '100%', justifyContent: 'center', padding: '0.65rem 1rem' }}>
                  {/* Google G */}
                  <svg width="16" height="16" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.5-1.45-.79-3-.79-4.59s.29-3.14.79-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  </svg>
                  Continue with Google
                </button>
              </form>
            </div>
          ) : (
            /* Add bookmark form */
            <div>
              {/* User row */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '1.25rem', paddingBottom: '1.25rem',
                borderBottom: '1px solid var(--border)'
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {user.email}
                </span>
                <form action={signOut}>
                  <button type="submit" className="btn-ghost" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>
                    Sign out
                  </button>
                </form>
              </div>

              {/* Form */}
              <form ref={formRef} onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                <input type="url" name="url" placeholder="https://" required className="field" />
                <input type="text" name="title" placeholder="Title" required className="field" />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                  <button type="submit" disabled={isPending} className="btn">
                    {isPending
                      ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.25)' }} /> Saving</>
                      : 'Save bookmark'
                    }
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* ── Bookmarks list ── */}
        {user && (
          <div className="card" style={{ padding: '0.25rem 1.75rem' }}>
            {optimisticBookmarks.length === 0 ? (
              <div style={{ padding: '3rem 0', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Nothing saved yet.
                </p>
              </div>
            ) : (
              optimisticBookmarks.map((bm, i) => (
                <div
                  key={bm.id}
                  className="bookmark-row"
                  style={{ animationDelay: `${i * 0.03}s` }}
                >
                  {/* Favicon */}
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${getDomain(bm.url)}&sz=32`}
                    alt=""
                    width={16}
                    height={16}
                    style={{ borderRadius: 3, flexShrink: 0, opacity: 0.8 }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  />

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <a
                      href={bm.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'block',
                        color: 'var(--text-primary)',
                        fontWeight: 500,
                        fontSize: '0.9rem',
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.4,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-link)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                    >
                      {bm.title}
                    </a>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.775rem' }}>
                        {getDomain(bm.url)}
                      </span>
                      <span style={{ color: 'var(--border)', fontSize: '0.7rem' }}>·</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.775rem' }}>
                        {formatDate(bm.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(bm.id)}
                    disabled={isPending}
                    className="btn-danger"
                    title="Remove"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
