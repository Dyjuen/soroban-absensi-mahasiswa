import { useState } from 'react'

interface Props {
  onSubmit: (nama: string, tahun: string, kelas: string) => Promise<string>
  loading: boolean
}

export default function StudentForm({ onSubmit, loading }: Props) {
  const [nama, setNama] = useState('')
  const [tahun, setTahun] = useState('')
  const [kelas, setKelas] = useState('')
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string; hash?: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    if (!nama || !tahun || !kelas) {
      setMsg({ type: 'error', text: 'All fields are required' })
      return
    }
    try {
      const hash = await onSubmit(nama, tahun, kelas)
      setMsg({ type: 'success', text: 'Student registered successfully', hash })
      setNama('')
      setTahun('')
      setKelas('')
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to register student' })
    }
  }

  return (
    <div className="card">
      <h2>Register Student</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name</label>
          <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="John Doe" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Academic Year</label>
            <input value={tahun} onChange={(e) => setTahun(e.target.value)} placeholder="2024" />
          </div>
          <div className="form-group">
            <label>Class</label>
            <input value={kelas} onChange={(e) => setKelas(e.target.value)} placeholder="TI-4C" />
          </div>
        </div>
        <button className="primary" type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      {msg && (
        <div className={`status-msg ${msg.type}`}>
          <p>{msg.text}</p>
          {msg.hash && <div className="hash" style={{ marginTop: 8 }}>Tx Hash: {msg.hash}</div>}
        </div>
      )}
    </div>
  )
}
