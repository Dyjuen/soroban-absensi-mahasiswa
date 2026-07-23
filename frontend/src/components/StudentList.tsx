import { Mahasiswa } from '../hooks/useContract'

interface Props {
  students: Mahasiswa[]
  loading: boolean
}

export default function StudentList({ students, loading }: Props) {
  return (
    <div className="card">
      <h2>Registered Students</h2>
      {loading && <p>Loading students...</p>}
      {!loading && students.length === 0 && <p>No students registered yet.</p>}
      {students.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>NIM</th>
              <th>Name</th>
              <th>Year</th>
              <th>Class</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.nim}>
                <td>{s.nim}</td>
                <td>{s.nama}</td>
                <td>{s.tahun}</td>
                <td>{s.kelas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
