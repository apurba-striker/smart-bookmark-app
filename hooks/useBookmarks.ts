'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface Bookmark {
    id: string
    url: string
    title: string
    created_at: string
}

export function useBookmarks(userId: string | undefined) {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        if (!userId) return

        let channel: RealtimeChannel

        const fetchBookmarks = async () => {
            const { data, error } = await supabase
                .from('bookmarks')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching bookmarks:', error)
            } else {
                setBookmarks(data || [])
            }
            setLoading(false)
        }

        const setupRealtimeSubscription = () => {
            channel = supabase
                .channel('bookmarks-changes')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'bookmarks',
                        filter: `user_id=eq.${userId}`,
                    },
                    (payload) => {
                        setBookmarks((prev) => [payload.new as Bookmark, ...prev])
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'DELETE',
                        schema: 'public',
                        table: 'bookmarks',
                        filter: `user_id=eq.${userId}`,
                    },
                    (payload) => {
                        setBookmarks((prev) =>
                            prev.filter((b) => b.id !== payload.old.id)
                        )
                    }
                )
                .subscribe()
        }

        fetchBookmarks()
        setupRealtimeSubscription()

        return () => {
            if (channel) {
                supabase.removeChannel(channel)
            }
        }
    }, [userId])

    return { bookmarks, loading }
}
