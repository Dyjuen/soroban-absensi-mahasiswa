import { useState } from 'react'
import { Mahasiswa } from '../hooks/useContract'
import TransactionFeedback from './TransactionFeedback'

interface Props {
  students: Mahasiswa[]
  contractLoading: boolean
  onCreateAttendance: (
    nim: number,
    device_name: string,
    location: string,
    datetime: string,
    subject: string,
    status: string
  ) => Promise<string>
  onSendPayment: (destination: string, amount: string) => Promise<string>
  deployerAddress: string
}

interface TxResult {
  success: boolean
  hash: string
  message: string
  steps?: string[]
}

export default function AttendanceForm({
  students,
  contractLoading,
  onCreateAttendance,
  onSendPayment,
  deployerAddress,
}: Props) {
  const [nim, setNim] = useState('')
  const [deviceName, setDeviceName] = useState('')
  const [location, setLocation] = useState('')
  const [datetime, setDatetime] = useState('')
  const [subject, setSubject] = useState('')
  const [status, setStatus] = useState('Hadir')
  const [xlmAmount, setXlmAmount] = useState('0.1')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<TxResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setResult(null)

    if (!nim || !deviceName || !location || !datetime || !subject) {
      setResult({ success: false, hash: '', message: 'All fields are required' })
      return
    }

    const xlm = parseFloat(xlmAmount)
    if (isNaN(xlm) || xlm <= 0) {
      setResult({ success: false, hash: '', message: 'Invalid XLM amount' })
      return
    }

    setProcessing(true)

    try {
      const steps: string[] = []
      const paymentHash = await onSendPayment(deployerAddress, xlmAmount)
      steps.push(`XLM payment sent (${xlmAmount} XLM)`)
      await onCreateAttendance(
        Number(nim),
        deviceName,
        location,
        datetime,
        subject,
        status
      )
      steps.push('Attendance recorded on-chain')

      setResult({
        success: true,
        hash: paymentHash,
        message: 'Attendance recorded successfully!',
        steps,
      })
    } catch (err: any) {
      setResult({
        success: false,
        hash: '',
        message: err.message || 'Transaction failed',
      })
    } finally {
      setProcessing(false)
    }
  }

  const now = new Date().toISOString().slice(0, 16)

  return (
    <div className="card">
      <h2>Record Attendance</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Student (NIM)</label>
          <select value={nim} onChange={(e) => setNim(e.target.value)}>
            <option value="">Select student</option>
            {students.map((s) => (
              <option key={s.nim} value={s.nim}>
                {s.nim} — {s.nama}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Device Name</label>
            <input value={deviceName} onChange={(e) => setDeviceName(e.target.value)} placeholder="iPhone 15" />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Gedung A Lt.3" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Date & Time</label>
            <input type="datetime-local" value={datetime || now} onChange={(e) => setDatetime(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Basis Data" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Hadir">Hadir</option>
              <option value="Izin">Izin</option>
              <option value="Sakit">Sakit</option>
              <option value="Alpa">Alpa</option>
            </select>
          </div>
          <div className="form-group">
            <label>XLM Amount (fee)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={xlmAmount}
              onChange={(e) => setXlmAmount(e.target.value)}
            />
          </div>
        </div>
        <button className="primary" type="submit" disabled={processing || contractLoading}>
          {processing ? 'Processing...' : `Record Attendance & Send ${xlmAmount} XLM`}
        </button>
      </form>
      <TransactionFeedback result={result} />
    </div>
  )
}
