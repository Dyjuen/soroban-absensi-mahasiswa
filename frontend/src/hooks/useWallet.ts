import { useState, useCallback } from 'react'
import { isConnected, getAddress, signTransaction } from '@stellar/freighter-api'
import {
  BASE_FEE,
  TransactionBuilder,
  Account,
  Operation,
  Asset,
} from '@stellar/stellar-sdk'
import { HORIZON_URL, RPC_URL, NETWORK_PASSPHRASE } from '../config'

export interface WalletState {
  address: string | null
  balance: string | null
  connecting: boolean
  error: string | null
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    balance: null,
    connecting: false,
    error: null,
  })

  const fetchBalance = useCallback(async (publicKey: string) => {
    try {
      const response = await fetch(`${RPC_URL}/accounts/${publicKey}`)
      if (!response.ok) throw new Error('Failed to fetch balance')
      const data = await response.json()
      const balanceLine = data.balances?.find(
        (b: any) => b.asset_type === 'native'
      )
      return balanceLine ? parseFloat(balanceLine.balance).toFixed(7) : '0'
    } catch {
      return '0'
    }
  }, [])

  const connect = useCallback(async () => {
    setState((s) => ({ ...s, connecting: true, error: null }))
    try {
      const connectedResult = await isConnected()
      if (!connectedResult.isConnected) throw new Error('Freighter not installed or locked')

      const addressResult = await getAddress()
      if (!addressResult.address) throw new Error('Failed to get address')
      const publicKey = addressResult.address
      const balance = await fetchBalance(publicKey)

      setState({
        address: publicKey,
        balance,
        connecting: false,
        error: null,
      })
    } catch (err: any) {
      setState((s) => ({
        ...s,
        connecting: false,
        error: err.message || 'Failed to connect wallet',
      }))
    }
  }, [fetchBalance])

  const disconnect = useCallback(() => {
    setState({ address: null, balance: null, connecting: false, error: null })
  }, [])

  const refreshBalance = useCallback(async () => {
    if (state.address) {
      const balance = await fetchBalance(state.address)
      setState((s) => ({ ...s, balance }))
    }
  }, [state.address, fetchBalance])

  const signAndSendXlmPayment = useCallback(
    async (destination: string, amount: string): Promise<string> => {
      if (!state.address) throw new Error('Wallet not connected')

      const accountResp = await fetch(`${HORIZON_URL}/accounts/${state.address}`)
      if (!accountResp.ok) throw new Error('Cannot fetch source account')
      const accountData = await accountResp.json()

      const source = new Account(state.address, accountData.sequence)
      const tx = new TransactionBuilder(source, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          Operation.payment({
            destination,
            asset: Asset.native(),
            amount,
          })
        )
        .setTimeout(300)
        .build()

      const signResult = await signTransaction(tx.toXDR(), {
        networkPassphrase: NETWORK_PASSPHRASE,
      })

      const submitResp = await fetch(`${HORIZON_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ tx: signResult.signedTxXdr }),
      })
      const submitData = await submitResp.json()

      if (submitData.status === 'FAILED' || submitData.type === 'https://stellar.org/horizon-errors/transaction_failed') {
        throw new Error(`Transaction failed: ${submitData.result_xdr || 'unknown error'}`)
      }

      return submitData.hash || ''
    },
    [state.address]
  )

  return { ...state, connect, disconnect, refreshBalance, signAndSendXlmPayment }
}
