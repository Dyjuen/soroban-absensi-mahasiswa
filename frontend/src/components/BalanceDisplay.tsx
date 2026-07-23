interface Props {
  balance: string | null
  address: string | null
}

export default function BalanceDisplay({ balance, address }: Props) {
  if (!address || balance === null) return null

  return (
    <div className="card">
      <h2>XLM Balance</h2>
      <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>
        {balance} XLM
      </p>
    </div>
  )
}
