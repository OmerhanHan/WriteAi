'use client'

import { use } from 'react'
import { notFound } from 'next/navigation'
import EpubReader from '@/components/reading/EpubReader'
import { getBookById } from '@/lib/reading'

type Props = {
  params: Promise<{ id: string }>
}

export default function ReaderPage({ params }: Props) {
  const { id } = use(params)
  const book = getBookById(id)
  if (!book) notFound()

  return <EpubReader book={book} />
}
