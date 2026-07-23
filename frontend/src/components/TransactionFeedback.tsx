interface TxResult {
  success: boolean
  hash: string
  message: string
  steps?: string[]
}

interface Props {
  result: TxResult | null
}

export default function TransactionFeedback({ result }: Props) {
  if (!result) return null

  return (
    <div className={`status-msg ${result.success ? 'success' : 'error'}`}>
      <p>{result.message}</p>
      {result.steps && result.steps.length > 0 && (
        <ul style={{ marginTop: 8, paddingLeft: 20 }}>
          {result.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      )}
      {result.hash && (
        <div className="hash" style={{ marginTop: 8 }}>
          Tx Hash: {result.hash}
        </div>
      )}
    </div>
  )
}
