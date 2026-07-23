interface Props {
  address: string | null
  connecting: boolean
  error: string | null
  onConnect: () => void
  onDisconnect: () => void
}

export default function WalletConnector({
  address,
  connecting,
  error,
  onConnect,
  onDisconnect,
}: Props) {
  if (address) {
    return (
      <div className="card-header">
        <div>
          <strong>Connected</strong>
          <div className="address">{address}</div>
        </div>
        <button className="secondary" onClick={onDisconnect}>
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div>
      <button
        className="primary"
        onClick={onConnect}
        disabled={connecting}
      >
        {connecting ? 'Connecting...' : 'Connect Freighter Wallet'}
      </button>
      {error && <div className="status-msg error">{error}</div>}
    </div>
  )
}
