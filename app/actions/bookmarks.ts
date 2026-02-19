'use server'

import { createClient } from '@/lib/supabase/server'
// Remove revalidatePath import

export async function addBookmark(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const url = formData.get('url') as string
    const title = formData.get('title') as string

    const { error } = await supabase
        .from('bookmarks')
        .insert({ user_id: user.id, url, title })

    if (error) throw error
}

export async function deleteBookmark(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id)

    if (error) throw error
}
