'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Test() {
    const [items, setItems] = useState<any[]>([])
    const [notes, setNotes] = useState<any[]>([])

    useEffect(() => {
        async function testConnection() {
            const { data, error } = await supabase.from('separators').select('*')
            console.log({ data, error })
            setItems(data ?? [])

            const { data: notesData, error: notesError } = await supabase.from('notes').select('*')
            console.log({ notesData, notesError })
            setNotes(notesData ?? [])
        }

        testConnection()
    }, [])

    return (
        <>
        <div>
            <h1>Test</h1>
            <h2>{items.length}</h2>
        </div>
        <div>
            {items.map((item) => (
                <>
                <div key={item.id}>
                    <p>{item.registry_number}</p>
                    <p>{item.name}</p>
                    <p>{item.created_at}</p>
                </div>
                <br />
                </>
            ))}
        </div>
        <br /><hr /><br />
        <div>
            {notes.map((note) => (
                <>
                <div key={note.id}>
                    <p>{note.number}</p>
                    <p>Item: {note.item_count}</p>
                    <p>Volume: {note.volume_count}</p>
                    <p>Status: {note.status}</p>
                    <p>Time: {note.separation_time}</p>
                    <p>User: {note.separator_id}</p>
                </div>
                <br />
                </>
            ))}
        </div>
        </>
    )
}
