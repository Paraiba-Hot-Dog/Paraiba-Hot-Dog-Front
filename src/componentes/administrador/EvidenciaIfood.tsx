import { useEffect, useRef, useState } from 'react'
import { Paperclip } from 'lucide-react'
import { disputeEvidence } from '../../servicos/ifoodApi'

export default function EvidenciaIfood({ pedidoId, disputaId, indice }: { pedidoId: number; disputaId: string; indice: number }) {
  const [file, setFile] = useState<{ url: string; image: boolean } | null>(null)
  const [erro, setErro] = useState('')
  const [busy, setBusy] = useState(false)
  const alive = useRef(true)
  const objectUrl = useRef<string | null>(null)
  useEffect(() => {
    alive.current = true
    return () => { alive.current = false; if (objectUrl.current) URL.revokeObjectURL(objectUrl.current) }
  }, [])
  async function carregar() {
    setBusy(true); setErro('')
    try {
      const blob = await disputeEvidence(pedidoId, disputaId, indice)
      if (!alive.current) return
      const url = URL.createObjectURL(blob)
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
      objectUrl.current = url
      setFile({ url, image: blob.type.startsWith('image/') })
    } catch (err) { if (alive.current) setErro(err instanceof Error ? err.message : 'Não foi possível carregar a evidência.') }
    finally { if (alive.current) setBusy(false) }
  }
  return <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
    {file ? <><a href={file.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold underline"><Paperclip size={14} /> Abrir evidência {indice + 1}</a>{file.image && <img src={file.url} alt={`Evidência ${indice + 1} enviada pelo cliente`} className="mt-2 max-h-64 w-full rounded-lg object-contain" />}</>
      : <button type="button" disabled={busy} onClick={() => { void carregar() }} className="inline-flex items-center gap-1 font-semibold underline disabled:opacity-50"><Paperclip size={14} />{busy ? 'Carregando…' : `Carregar evidência ${indice + 1}`}</button>}
    {erro && <p role="alert" className="mt-2 text-xs text-red-700">{erro}</p>}
  </div>
}
