import { useCallback, useState } from 'react'
import { signTransaction } from '@stellar/freighter-api'
import {
  TransactionBuilder,
  Account,
  BASE_FEE,
  nativeToScVal,
  xdr,
  Operation,
} from '@stellar/stellar-sdk'
import { CONTRACT_ID, RPC_URL, NETWORK_PASSPHRASE } from '../config'

export interface Mahasiswa {
  nim: number
  nama: string
  tahun: string
  kelas: string
}

export interface Absensi {
  id: number
  mahasiswa: Mahasiswa
  device_name: string
  location: string
  datetime: string
  subject: string
  status: string
}

function strVal(s: string): xdr.ScVal {
  return nativeToScVal(s, { type: 'string' })
}

function u64Val(n: number): xdr.ScVal {
  return nativeToScVal(n, { type: 'u64' })
}

async function simulateContract(
  method: string,
  args: xdr.ScVal[],
  source: string
): Promise<any> {
  const body = {
    jsonrpc: '2.0',
    id: 1,
    method: 'simulateTransaction',
    params: [
      {
        source,
        operations: [
          {
            function: 'invokeContractFunction',
            contractId: CONTRACT_ID,
            method,
            args,
          },
        ],
      },
    ],
  }

  const resp = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return resp.json()
}

export function useContract(address: string | null) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const callContract = useCallback(
    async (method: string, args: xdr.ScVal[]): Promise<any> => {
      if (!address) throw new Error('Wallet not connected')
      setLoading(true)
      setError(null)
      try {
        const sim = await simulateContract(method, args, address)
        const txData = sim.result?.transactionData
        if (!txData) throw new Error(`Simulation failed: ${JSON.stringify(sim)}`)

        const serverResp = await fetch(`${RPC_URL}/accounts/${address}`)
        const accountData = await serverResp.json()

        const source = new Account(address, accountData.sequence.toString())
        const tx = new TransactionBuilder(source, {
          fee: BASE_FEE,
          networkPassphrase: NETWORK_PASSPHRASE,
        })
          .addOperation(
            Operation.invokeContractFunction({
              contract: CONTRACT_ID,
              function: method,
              args,
            })
          )
          .setTimeout(300)
          .build()

        const signedXdr = await signTransaction(tx.toXDR(), {
          networkPassphrase: NETWORK_PASSPHRASE,
        })

        const submitResp = await fetch(`${RPC_URL}/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tx: signedXdr }),
        })
        const result = await submitResp.json()

        if (
          result.status === 'FAILED' ||
          (result.result && result.result.status === 'FAILED')
        ) {
          throw new Error('Contract invocation failed')
        }

        return result
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Contract call failed'
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [address]
  )

  const getStudents = useCallback(async (): Promise<Mahasiswa[]> => {
    if (!address) return []
    try {
      const sim = await simulateContract('get_mahasiswa', [], address)
      const raw = sim.result?.results?.[0]?.value
      if (!raw) return []
      return (raw as any[]).map((m: any) => ({
        nim: m.nim,
        nama: m.nama,
        tahun: m.tahun,
        kelas: m.kelas,
      }))
    } catch {
      return []
    }
  }, [address])

  const createStudent = useCallback(
    async (nama: string, tahun: string, kelas: string): Promise<string> => {
      const result = await callContract('create_mahasiswa', [
        strVal(nama),
        strVal(tahun),
        strVal(kelas),
      ])
      return result.hash || result.id || ''
    },
    [callContract]
  )

  const createAttendance = useCallback(
    async (
      nim: number,
      device_name: string,
      location: string,
      datetime: string,
      subject: string,
      status: string
    ): Promise<string> => {
      const result = await callContract('create_absensi', [
        u64Val(nim),
        strVal(device_name),
        strVal(location),
        strVal(datetime),
        strVal(subject),
        strVal(status),
      ])
      return result.hash || result.id || ''
    },
    [callContract]
  )

  return {
    loading,
    error,
    getStudents,
    createStudent,
    createAttendance,
  }
}
