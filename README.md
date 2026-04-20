# 📋 Absensi Mahasiswa — Soroban Smart Contract

A decentralized student attendance management system built on the **Stellar blockchain** using **Soroban smart contracts** (Rust). This contract allows institutions to register students and record their attendance data immutably on-chain.

---

## 🚀 Features

| Feature | Description |
|---|---|
| `get_mahasiswa` | Retrieve all registered student records from contract storage |
| `create_mahasiswa` | Register a new student with NIM, name, academic year, and class |
| `delete_mahasiswa` | Remove a student record by NIM |
| `get_absensi` | Retrieve all attendance records from contract storage |
| `create_absensi` | Record a new attendance entry linked to a registered student (by NIM), including device name, location, datetime, subject, and status |

---

## 🏗️ Data Structures

### `Mahasiswa` (Student)
```rust
pub struct Mahasiswa {
    pub nim: u64,       // Student ID (auto-generated)
    pub nama: String,   // Full name
    pub tahun: String,  // Academic year (e.g. "2024")
    pub kelas: String,  // Class (e.g. "IF-A")
}
```

### `Absensi` (Attendance)
```rust
pub struct Absensi {
    pub id: u64,                  // Attendance ID (auto-generated)
    pub mahasiswa: Mahasiswa,     // Linked student data
    pub device_name: String,      // Device used for check-in
    pub location: String,         // Physical location
    pub datetime: String,         // Date and time of attendance
    pub subject: String,          // Subject / course name
    pub status: String,           // e.g. "Hadir", "Izin", "Alpa"
}
```

---

## 🌐 Testnet Deployment

| Property | Value |
|---|---|
| **Network** | Stellar Testnet |
| **Contract ID** | `CCNMB2M7UARGN6AETTJXS6RARYUKGRA34XQE6GLRFVV2ZRZFCL3MT6NO` |
| **Deployer Address** | `GBVICMQAR6IG6MKUGRLWQUJDDZUANGPK6QKZK2NF4JFJNCCOLY7E7CXB` |
| **Explorer** | [Stellar Lab Contract Explorer](https://lab.stellar.org/contract-explorer) |

---

## 🖼️ Testnet Screenshots

### Contract Explorer — `get_absensi`
![Contract Explorer showing get_absensi invocation](./screenshots/get_absensi.png)

> Invoking `get_absensi` via Stellar Lab. The contract returns an empty `vec` when no attendance records have been submitted yet.

---

## 🛠️ Getting Started

### Prerequisites
- [Rust](https://www.rust-lang.org/tools/install)
- [Stellar CLI](https://developers.stellar.org/docs/tools/stellar-cli)
- Soroban SDK (`soroban-sdk`)

### Build
```bash
cargo build --target wasm32-unknown-unknown --release
```

### Run Tests
```bash
cargo test
```

### Deploy to Testnet
```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/absen_mahasiswa.wasm \
  --network testnet \
  --source <YOUR_SECRET_KEY>
```

### Invoke Contract (Examples)

**Register a student:**
```bash
stellar contract invoke \
  --id CCNMB2M7UARGN6AETTJXS6RARYUKGRA34XQE6GLRFVV2ZRZFCL3MT6NO \
  --network testnet \
  --source <YOUR_SECRET_KEY> \
  -- create_mahasiswa \
  --nama "John Doe" \
  --tahun "2024" \
  --kelas "TI-4C"
```

**Get all students:**
```bash
stellar contract invoke \
  --id CCNMB2M7UARGN6AETTJXS6RARYUKGRA34XQE6GLRFVV2ZRZFCL3MT6NO \
  --network testnet \
  --source <YOUR_SECRET_KEY> \
  -- get_mahasiswa
```

**Record attendance:**
```bash
stellar contract invoke \
  --id CCNMB2M7UARGN6AETTJXS6RARYUKGRA34XQE6GLRFVV2ZRZFCL3MT6NO \
  --network testnet \
  --source <YOUR_SECRET_KEY> \
  -- create_absensi \
  --nim <NIM_VALUE> \
  --device_name "iPhone 15" \
  --location "Gedung A Lantai 3" \
  --datetime "2025-01-20 08:00" \
  --subject "Basis Data" \
  --status "Hadir"
```

---

## 📁 Project Structure

```
.
├── src/
│   ├── lib.rs       # Main contract logic
│   └── test.rs      # Unit tests
├── screenshots/
│   └── get_absensi.png
├── Cargo.toml
└── README.md
```

---

## 📄 License

MIT License — free to use, modify, and distribute.