import { useState, useEffect, useCallback } from 'react'
import { useWallet } from './hooks/useWallet'
import { useContract, fetchStudents } from './hooks/useContract'
import type { Mahasiswa } from './hooks/useContract'
import WalletConnector from './components/WalletConnector'
import BalanceDisplay from './components/BalanceDisplay'
import StudentForm from './components/StudentForm'
import StudentList from './components/StudentList'
import AttendanceForm from './components/AttendanceForm'
import { DEPLOYER_ADDRESS } from './config'

export default function App() {
  const wallet = useWallet()
  const { createStudent, createAttendance, loading: contractLoading } = useContract(wallet.address)
  const [students, setStudents] = useState<Mahasiswa[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)

  const refreshStudents = useCallback(async () => {
    if (!wallet.address) return
    setStudentsLoading(true)
    try {
      const list = await fetchStudents(wallet.address)
      setStudents(list)
    } catch {
      // silent
    } finally {
      setStudentsLoading(false)
    }
  }, [wallet.address])

  useEffect(() => {
    if (wallet.address) refreshStudents()
    else setStudents([])
  }, [wallet.address])

  const handleRegisterStudent = async (nama: string, tahun: string, kelas: string) => {
    await createStudent(nama, tahun, kelas)
    await refreshStudents()
  }

  const handleCreateAttendance = async (
    nim: number,
    device_name: string,
    location: string,
    datetime: string,
    subject: string,
    status: string
  ): Promise<string> => {
    const hash = await createAttendance(nim, device_name, location, datetime, subject, status)
    await wallet.refreshBalance()
    return hash
  }

  return (
    <div className="app">
      <h1>Absensi Mahasiswa</h1>
      <p style={{ color: '#6b7280', marginBottom: 20 }}>
        Student Attendance dApp — Stellar Testnet
      </p>

      <div className="card">
        <WalletConnector
          address={wallet.address}
          connecting={wallet.connecting}
          error={wallet.error}
          onConnect={wallet.connect}
          onDisconnect={wallet.disconnect}
        />
      </div>

      <BalanceDisplay balance={wallet.balance} address={wallet.address} />

      {wallet.address && (
        <>
          <StudentForm
            onSubmit={handleRegisterStudent}
            loading={contractLoading}
          />
          <StudentList students={students} loading={studentsLoading} />
          <AttendanceForm
            students={students}
            contractLoading={contractLoading}
            onCreateAttendance={handleCreateAttendance}
            onSendPayment={wallet.signAndSendXlmPayment}
            deployerAddress={DEPLOYER_ADDRESS}
          />
        </>
      )}
    </div>
  )
}
