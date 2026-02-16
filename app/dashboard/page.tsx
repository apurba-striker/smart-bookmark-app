'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useBookmarks } from '@/hooks/useBookmarks'
import { signOut } from '@/app/actions/auth'
import type { User } from '@supabase/supabase-js'

export default function Dashboard() {
    const [user, setUser] = useState<User | null>(null)
    const [url, setUrl] = useState('')
    const [title, setTitle] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const supabase = createClient()
    const { bookmarks, loading } = useBookmarks(user?.id)

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        getUser()
    }, [])

    const handleAddBookmark = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!url || !title) return

        setSubmitting(true)
        const { error } = await supabase
            .from('bookmarks')
            .insert({ url, title, user_id: user?.id })

        if (error) {
            console.error('Error adding bookmark:', error)
        } else {
            setUrl('')
            setTitle('')
        }
        setSubmitting(false)
    }

    const handleDelete = async (id: string) => {
        await supabase.from('bookmarks').delete().eq('id', id)
    }

    if (!user) return <div className="p-8">Loading...</div>

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Smart Bookmarks</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">{user.email}</span>
                        <button
                            onClick={() => signOut()}
                            className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <form onSubmit={handleAddBookmark} className="bg-white p-6 rounded-lg shadow mb-8">
                    <h2 className="text-xl font-semibold mb-4">Add New Bookmark</h2>
                    <div className="space-y-4">
                        <input
                            type="url"
                            placeholder="URL"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <input
                            type="text"
                            placeholder="Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            {submitting ? 'Adding...' : 'Add Bookmark'}
                        </button>
                    </div>
                </form>

                <div className="bg-white rounded-lg shadow">
                    <h2 className="text-xl font-semibold p-6 border-b">My Bookmarks</h2>
                    {loading ? (
                        <p className="p-6 text-gray-500">Loading bookmarks...</p>
                    ) : bookmarks.length === 0 ? (
                        <p className="p-6 text-gray-500">No bookmarks yet. Add one above!</p>
                    ) : (
                        <ul className="divide-y">
                            {bookmarks.map((bookmark) => (
                                <li key={bookmark.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                    <div>
                                        <a
                                            href={bookmark.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline font-medium"
                                        >
                                            {bookmark.title}
                                        </a>
                                        <p className="text-sm text-gray-500 mt-1">{bookmark.url}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(bookmark.id)}
                                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                                    >
                                        Delete
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </main>
        </div>
    )
}
