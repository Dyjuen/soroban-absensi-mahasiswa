#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Env, String, Symbol, Vec};

#[contracttype]
#[derive(Clone, Debug)]
pub struct Mahasiswa {
    pub nim: u64,
    pub nama: String,
    pub tahun: String,
    pub kelas: String,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Absensi {
    pub id: u64,
    pub mahasiswa: Mahasiswa,
    pub device_name: String,
    pub location: String,
    pub datetime: String,
    pub subject: String,
    pub status: String,
}

const MAHASISWA_DATA: Symbol = symbol_short!("MHS_DATA");
const ABSENSI_DATA: Symbol = symbol_short!("ABS_DATA");

#[contract]
pub struct AbsenMahasiswaContract;

#[contractimpl]
impl AbsenMahasiswaContract {

    // ── Mahasiswa ──────────────────────────────

    /// Ambil semua data mahasiswa dari storage
    pub fn get_mahasiswa(env: Env) -> Vec<Mahasiswa> {
        env.storage()
            .instance()
            .get(&MAHASISWA_DATA)
            .unwrap_or(Vec::new(&env))
    }

    /// Tambahkan mahasiswa baru
    pub fn create_mahasiswa(
        env: Env,
        nama: String,
        tahun: String,
        kelas: String,
    ) -> String {
        let mut mahasiswas: Vec<Mahasiswa> = env
            .storage()
            .instance()
            .get(&MAHASISWA_DATA)
            .unwrap_or(Vec::new(&env));

        let mahasiswa = Mahasiswa {
            nim: env.prng().gen::<u64>(),
            nama,
            tahun,
            kelas,
        };

        mahasiswas.push_back(mahasiswa);
        env.storage().instance().set(&MAHASISWA_DATA, &mahasiswas);

        String::from_str(&env, "Mahasiswa berhasil ditambahkan")
    }

    /// Hapus mahasiswa berdasarkan NIM
    pub fn delete_mahasiswa(env: Env, nim: u64) -> String {
        let mut mahasiswas: Vec<Mahasiswa> = env
            .storage()
            .instance()
            .get(&MAHASISWA_DATA)
            .unwrap_or(Vec::new(&env));

        for i in 0..mahasiswas.len() {
            if mahasiswas.get(i).unwrap().nim == nim {
                mahasiswas.remove(i);
                env.storage().instance().set(&MAHASISWA_DATA, &mahasiswas);
                return String::from_str(&env, "Mahasiswa berhasil dihapus");
            }
        }

        String::from_str(&env, "Mahasiswa tidak ditemukan")
    }

    // ── Absensi ────────────────────────────────

    /// Ambil semua data absensi dari storage
    pub fn get_absensi(env: Env) -> Vec<Absensi> {
        env.storage()
            .instance()
            .get(&ABSENSI_DATA)
            .unwrap_or(Vec::new(&env))
    }

    /// Tambahkan absensi baru untuk mahasiswa yang sudah terdaftar (dicari by NIM)
    pub fn create_absensi(
        env: Env,
        nim: u64,
        device_name: String,
        location: String,
        datetime: String,
        subject: String,
        status: String,
    ) -> String {
        // Cari mahasiswa berdasarkan NIM
        let mahasiswas: Vec<Mahasiswa> = env
            .storage()
            .instance()
            .get(&MAHASISWA_DATA)
            .unwrap_or(Vec::new(&env));

        let mut found_mahasiswa: Option<Mahasiswa> = None;
        for i in 0..mahasiswas.len() {
            let mhs = mahasiswas.get(i).unwrap();
            if mhs.nim == nim {
                found_mahasiswa = Some(mhs);
                break;
            }
        }

        match found_mahasiswa {
            None => String::from_str(&env, "Mahasiswa tidak ditemukan"),
            Some(mahasiswa) => {
                let mut absensis: Vec<Absensi> = env
                    .storage()
                    .instance()
                    .get(&ABSENSI_DATA)
                    .unwrap_or(Vec::new(&env));

                let absensi = Absensi {
                    id: env.prng().gen::<u64>(),
                    mahasiswa,
                    device_name,
                    location,
                    datetime,
                    subject,
                    status,
                };

                absensis.push_back(absensi);
                env.storage().instance().set(&ABSENSI_DATA, &absensis);

                String::from_str(&env, "Absensi berhasil ditambahkan")
            }
        }
    }
}

mod test;