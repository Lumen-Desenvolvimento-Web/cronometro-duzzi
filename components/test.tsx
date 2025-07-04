'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Data = {
    id: number
    name: string
    quantity: number
}

export default function Test() {
    const [items, setItems] = useState<any[]>([])

    useEffect(() => {
        async function testConnection() {
            const { data, error } = await supabase.from('test').select('*')
            console.log({ data, error })
            setItems(data ?? [])
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
                <div key={item.id}>
                    <p>{item.id}</p>
                    <p>{item.name}</p>
                    <p>{item.quantity}</p>
                </div>
            ))}
        </div>
        </>
    )
}
