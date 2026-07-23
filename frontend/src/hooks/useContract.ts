import { useCallback, useMemo, useState } from 'react'
import { signTransaction } from '@stellar/freighter-api'
import {
  SorobanRpc,
  TransactionBuilder,
  Transaction,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
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

export function useContract(address: string | null) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const callContract = useCallback(
    async (method: string, args: xdr.ScVal[]): Promise<{ hash: string; status: string }> => {
      if (!address) throw new Error('Wallet not connected')
      setLoading(true)
      setError(null)

      try {
        const server = new SorobanRpc.Server(RPC_URL)
        const account = await server.getAccount(address)

        const tx = new TransactionBuilder(account, {
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

        const preparedTx = await server.prepareTransaction(tx)

        const signed = await signTransaction(
          preparedTx.toXDR(),
          {
            networkPassphrase: NETWORK_PASSPHRASE,
          }
        )

        const signedTx = new Transaction(signed.signedTxXdr, NETWORK_PASSPHRASE)

        const sendResult = await server.sendTransaction(signedTx)

        if (sendResult.status === 'ERROR') {
          throw new Error(
            `Contract invocation failed: ${sendResult.errorResult || sendResult.status}`
          )
        }

        const hash = sendResult.hash
        let attempts = 0
        const maxAttempts = 30
        while (attempts < maxAttempts) {
          const txResult = await server.getTransaction(hash)
          if (txResult.status === 'SUCCESS') break
          if (txResult.status === 'FAILED') {
            throw new Error(`Transaction failed on-chain: ${hash}`)
          }
          attempts++
          await new Promise((r) => setTimeout(r, 1000))
        }
        if (attempts >= maxAttempts) {
          throw new Error(`Transaction not confirmed after ${maxAttempts}s: ${hash}`)
        }

        return { hash, status: 'SUCCESS' }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Contract call failed'
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
      const server = new SorobanRpc.Server(RPC_URL)
      const account = await server.getAccount(address)

      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          Operation.invokeContractFunction({
            contract: CONTRACT_ID,
            function: 'get_mahasiswa',
            args: [],
          })
        )
        .setTimeout(300)
        .build()

      const simResult = await server.simulateTransaction(tx)

      if ('error' in simResult || !simResult.result?.retval) {
        return []
      }

      const raw = scValToNative(simResult.result.retval)
      if (!raw || !Array.isArray(raw)) return []

      return raw.map((item: any) => ({
        nim: Number(item.nim),
        nama: String(item.nama),
        tahun: String(item.tahun),
        kelas: String(item.kelas),
      }))
    } catch {
      return []
    }
  }, [address])

  const getAttendance = useCallback(async (): Promise<Absensi[]> => {
    if (!address) return []
    try {
      const server = new SorobanRpc.Server(RPC_URL)
      const account = await server.getAccount(address)

      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          Operation.invokeContractFunction({
            contract: CONTRACT_ID,
            function: 'get_absensi',
            args: [],
          })
        )
        .setTimeout(300)
        .build()

      const simResult = await server.simulateTransaction(tx)

      if ('error' in simResult || !simResult.result?.retval) {
        return []
      }

      const raw = scValToNative(simResult.result.retval)
      if (!raw || !Array.isArray(raw)) return []

      return raw.map((item: any) => ({
        id: Number(item.id),
        mahasiswa: {
          nim: Number(item.mahasiswa.nim),
          nama: String(item.mahasiswa.nama),
          tahun: String(item.mahasiswa.tahun),
          kelas: String(item.mahasiswa.kelas),
        },
        device_name: String(item.device_name),
        location: String(item.location),
        datetime: String(item.datetime),
        subject: String(item.subject),
        status: String(item.status),
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
      return result.hash
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
      return result.hash
    },
    [callContract]
  )

  return useMemo(
    () => ({
      loading,
      error,
      getStudents,
      getAttendance,
      createStudent,
      createAttendance,
    }),
    [loading, error, getStudents, getAttendance, createStudent, createAttendance]
  )
}
