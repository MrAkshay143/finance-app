# Production Verification Report: Idempotency & Financial Concurrency (Sub-Agent A)

**Target Environment:**
- **Base URL:** `https://finance.imakshay.in`
- **Production MariaDB Host:** `srv2201.hstgr.io:3306/u581617111_financeapp`
- **Live Build ID:** `20260915-prod-remediation-v3`
- **Execution Timestamp:** `2026-09-15T01:12:48.533Z`
- **Test Run ID:** `run_1789434768533`
- **Status:** **100% PASSED (All 6 Test Protocols & Mandatory Requirements Satisfied)**

---

## Executive Summary

Sub-Agent A executed exhaustive verification on Hostinger Production covering HTTP idempotency replay semantics, request canonicalization under payload key permutation, payload conflict rejection, high-concurrency idempotency races, and bidirectional opposing account transfer concurrency under strict ACID row-level locking. All created entities were tracked with exact primary keys and cleaned up in strict reverse foreign-key dependency order, confirming 0 residual test records and verifying non-deletion immutability of audit log triggers.

| Test # | Verification Objective | Invariants Tested | Result | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Test 1** | Idempotency Replay | 201 Replay, Header `X-Idempotency-Replayed: true`, DB Count = 1 | **PASSED** | Initial: 76ms, Replay: 96ms |
| **Test 2** | Canonical Key Shuffling | Fingerprint invariance under JSON key permutation | **PASSED** | 71ms |
| **Test 3** | Payload Conflict | HTTP 409 `IDEMPOTENCY_CONFLICT`, 0 DB mutation | **PASSED** | 64ms |
| **Test 4** | High-Concurrency Race | 5 simultaneous identical POSTs, exactly 1 DB record | **PASSED** | 52ms - 148ms |
| **Test 5** | Opposing Transfer Concurrency | 20 simultaneous transfers (10 A->B, 10 B->A), 0 deadlocks, Delta = 0 | **PASSED** | 306ms wall-clock |
| **Test 6** | Exact-ID Cleanup & FK Audit | Dynamic FK resolution, 0 residual records, audit logs intact | **PASSED** | 100% Cleaned |

---

## Exact-ID Tracking Registry

All IDs created during this execution run were tracked explicitly:

- **Test User ID:** `9c5b4e45-6a70-4435-862a-f27be21bff01`
  - Email: `subagent_a_idemp_1789434769737@imakshay.in`
- **Account IDs:**
  - Primary Test Account (Tests 1-4): `d85efbdf-3f2d-4ddb-80f3-3725b5ff845d` (Initial Balance: 50,000 INR = 5,000,000 paise)
  - Account Alpha (Test 5): `df065495-70ab-4cf2-8ed5-4dc85dab1ad2` (Initial Balance: 10,000 INR = 1,000,000 paise)
  - Account Beta (Test 5): `3342e068-064d-4274-b596-47313ac05678` (Initial Balance: 10,000 INR = 1,000,000 paise)
- **Transaction IDs:**
  - Test 1 Transaction: `3d4ac150-5c64-4d3e-85e6-550b7f98724a`
  - Test 4 Race Transaction: `5451e1e2-c386-469c-baf9-0bc7ed297510`
  - Test 5 Dual-Leg Transactions (40 total: 20 debits, 20 credits):
    - `5dc8ae5f-d24a-4c76-8999-c2e6b837962d`, `49e865dd-79a6-40ce-baff-0fca165b44e5`, `0a745b87-ad80-45e9-9038-b27f25f233a1`, `07652508-3501-44b0-8d16-2a5d0af1cc57`, `4cb3d043-f4ce-4b2d-b621-e3390af2469a`, `a6427b7a-f6e2-4359-a50c-94b100afe83c`, `0cd04325-5c92-482a-8b60-b1d30a792889`, `38362147-06f6-49ab-969e-b729e97e21ca`, `03ccaa75-f9b0-4aa6-8136-224fb813d24b`, `56c7b1c1-8d8c-4716-bcc9-4ba0a3d38f30`, `f81e7e14-a64f-45a3-a079-4c80acc7fd8c`, `b4e59478-5bd3-4c46-bc92-56c295cc758d`, `dc91fa36-eece-4587-a863-a40a53bffb49`, `d1174d8e-48f8-40d6-842c-c89406a9d150`, `d13d42be-333f-4478-94fb-5a0ae882fa42`, `1562d132-ccdd-4530-a38d-de8c6708ce0f`, `dbdcc8d0-af62-4d45-b785-7bb54c120e52`, `4aa4ccb4-e962-4435-a00c-3a110db140f4`, `0ef122b3-a57d-48f7-8d21-2d75fda9586a`, `49a7178a-639a-4480-a0b8-87f0d3ffb471`, `afb788c3-9312-4c6e-9455-0bfc798e23bb`, `638827b5-3a3b-4ba5-8251-b54e6393571b`, `9b981a1e-a888-486f-b099-8d24a94b1e67`, `5bb305ea-3db5-49df-84fa-388f8d50f837`, `6a438753-4f96-419b-ab29-f53e3f421f5e`, `779f061f-13fc-4632-9ecb-ebdbf14fc7cf`, `ca534a66-ce24-4f05-8be4-8c83a71b4c4f`, `7f5e3158-fe24-4b5b-a7e8-e58f00fc9d56`, `9199d7a2-c313-41e9-a476-ebdfa40ca385`, `924f3316-ea33-4ca2-8db4-f06b9868f7dc`, `a89f92dc-1294-4b20-ba88-29471168912d`, `fb83ea74-db80-49fe-a518-ff3db199fbdb`, `5406d445-566d-4950-b0f3-d020d0f7a7eb`, `9cf8bf27-ee8d-4f1d-b570-07bf1cae7fd4`, `706cf48e-28c0-43b8-8c10-91ae619bf450`, `9419cf5c-a5b6-4b95-a226-c222ff47e008`, `443743e4-df3c-44da-b0ca-2292f9e422ee`, `7c53e0ba-c8b5-48fa-8488-81fb79a32c58`, `b84fc476-c0ff-4f46-8809-58bfe02efc2e`, `98dcfca0-eef3-47ae-823a-f2b7b3be1fa2`
- **Transfer IDs (20 total):**
  - `e1da5889-40ea-46b5-ab78-c0b759ea24d2`, `c8dcf936-a83d-4c31-97b7-5a507851ee73`, `3b1c6d32-d17e-4bca-8eb1-ff0555938bf8`, `efdf09b5-45fc-4fa1-ba47-15efad036b13`, `2467d013-0979-450f-a494-b25851608670`, `d50dcda2-1b15-46ae-8869-9dd384a6c478`, `44e8c160-c447-49fb-8ec2-132d7515cfb0`, `66fe08e8-b789-49cf-b7c1-dfb552636fba`, `d9e033d5-ae3d-4e98-be4c-9f89fb7f0be1`, `397cf1e2-b8ec-4581-8b36-547df82dfeb4`, `731a5e18-6c84-486a-a03a-c8ba56910dd9`, `151ff821-2a13-432d-aeaa-fb9d749962a9`, `bb7f6c6a-4632-4217-bead-a88981fcae12`, `7486e92f-dc8c-4a15-b77a-a430d4732688`, `95efab41-2a7e-4074-b4a1-f3b14115e45d`, `0b02bb7c-2b63-4700-9828-98e3b5cae1a9`, `44fb8d87-3c58-45a0-a7d1-efd5e0f760e1`, `cb0cf032-aa59-4d64-a135-2633036c05db`, `2ef5ae9c-64aa-49f4-90ee-5efab05b63d9`, `08bcfb5c-fc37-4d92-911a-1d5ce5b214df`
- **Idempotency Keys Created (22 total):**
  - `test-key-001`, `test-race-key-002`
  - `transfer-opposing-A-B-1..10`, `transfer-opposing-B-A-1..10`
- **Audit Logs Recorded (26 total):**
  - Preserved in `audit_logs` table (actorUserId updated to NULL via engine-level ON DELETE SET NULL).

---

## Detailed Test Results & Evidence

### Test 1: Idempotency Replay
**Protocol:**
1. Send initial `POST /api/v1/transactions` with header `X-Idempotency-Key: test-key-001`.
   ```json
   {
     "accountId": "d85efbdf-3f2d-4ddb-80f3-3725b5ff845d",
     "type": "EXPENSE",
     "direction": "DEBIT",
     "amount": 100,
     "description": "Test 1 Idempotency Replay run_1789434768533"
   }
   ```
2. Re-send identical `POST /api/v1/transactions` with same header and payload.

**Results & Assertions:**
- Initial Request: HTTP 201 Created in 76ms. Header `X-Idempotency-Replayed: null`.
- Replay Request: HTTP 201 Created in 96ms. Header `X-Idempotency-Replayed: true`.
- Body Identity: `JSON.stringify(body1) === JSON.stringify(bodyReplay)` -> **TRUE**
- MariaDB Query:
  ```sql
  SELECT id, userId, accountId, type, direction, amount, description, createdAt
  FROM transactions
  WHERE userId = '9c5b4e45-6a70-4435-862a-f27be21bff01'
    AND description = 'Test 1 Idempotency Replay run_1789434768533';
  ```
  Rows found: **Exactly 1 row** (ID: `3d4ac150-5c64-4d3e-85e6-550b7f98724a`, amount: 10000 paise).
- MariaDB Idempotency Record:
  ```sql
  SELECT id, `key`, statusCode FROM idempotency_records WHERE `key` = 'test-key-001';
  ```
  Found: ID `7e7a4256-c8d9-425c-a63b-812155f4c1b5`, `statusCode = 201`.
- **Verdict:** **PASSED**

---

### Test 2: Idempotency Canonical Key Shuffling
**Protocol:**
Send `POST /api/v1/transactions` with same key `test-key-001`, but shuffle object property keys:
- Original key order: `['accountId', 'type', 'direction', 'amount', 'description']`
- Shuffled key order: `['description', 'amount', 'direction', 'type', 'accountId']`

**Results & Assertions:**
- Status Code: HTTP 201 Created in 71ms.
- Header: `X-Idempotency-Replayed: true`.
- Response Body: Identical to original cached body (`data.id === '3d4ac150-5c64-4d3e-85e6-550b7f98724a'`).
- MariaDB Transaction Count: Still **exactly 1 row**.
- **Verdict:** **PASSED** (Fingerprint canonicalization correctly ignored JSON key permutation).

---

### Test 3: Idempotency Payload Conflict
**Protocol:**
Send `POST /api/v1/transactions` with same key `test-key-001`, but mutate payload (`amount: 200` instead of `100`).

**Results & Assertions:**
- Status Code: **HTTP 409 Conflict** in 64ms.
- Response Body:
  ```json
  {
    "error": {
      "code": "IDEMPOTENCY_CONFLICT",
      "message": "Idempotency key was already used with a different request payload."
    }
  }
  ```
- Error Code Assertion: `body.error.code === 'IDEMPOTENCY_CONFLICT'` -> **TRUE**.
- MariaDB Mutation Audit:
  ```sql
  SELECT id FROM transactions WHERE userId = '9c5b4e45-6a70-4435-862a-f27be21bff01' AND amount = 20000;
  ```
  Rows found: **0 rows**. Zero side-effects occurred.
- **Verdict:** **PASSED**

---

### Test 4: High-Concurrency Idempotency Race
**Protocol:**
Issue 5 simultaneous identical `POST /api/v1/transactions` requests using `Promise.all` with a fresh header `X-Idempotency-Key: test-race-key-002` (amount: 50 INR = 5,000 paise).

**Results & Assertions:**
- Request #1: HTTP 201 Created in 52ms (`x-idempotency-replayed: null`). Original Winner.
- Request #2: HTTP 201 Created in 109ms (`x-idempotency-replayed: true`). Safely Replayed.
- Request #3: HTTP 201 Created in 108ms (`x-idempotency-replayed: true`). Safely Replayed.
- Request #4: HTTP 201 Created in 142ms (`x-idempotency-replayed: true`). Safely Replayed.
- Request #5: HTTP 201 Created in 148ms (`x-idempotency-replayed: true`). Safely Replayed.
- Server Error Rate: **0% (0 / 5)**.
- MariaDB Audit:
  ```sql
  SELECT id, amount, description FROM transactions
  WHERE userId = '9c5b4e45-6a70-4435-862a-f27be21bff01'
    AND description = 'Test 4 High-Concurrency Race run_1789434768533';
  ```
  Matching Rows: **EXACTLY 1 ROW** (ID: `5451e1e2-c386-469c-baf9-0bc7ed297510`).
- **Verdict:** **PASSED**

---

### Test 5: Opposing Transfer Concurrency (Crucial Safeguard)
**Protocol:**
1. Provision Account Alpha (`openingBalance: 10,000 INR` = 1,000,000 paise) and Account Beta (`openingBalance: 10,000 INR` = 1,000,000 paise).
2. Initial System Balance: **20,000 INR** (2,000,000 paise).
3. Concurrently dispatch 10 transfers from Alpha -> Beta (100 INR each) AND 10 transfers from Beta -> Alpha (100 INR each) simultaneously across 20 concurrent HTTP promises via `Promise.all`.

**Results & Assertions:**
- Wall-Clock Completion Time: **306ms** across all 20 concurrent transfer transactions.
- Successful Transfers: **20 / 20 (100%)**.
- Deadlocks (`ER_LOCK_DEADLOCK` / SQLSTATE `40001`): **0**.
- Uncaught Server Errors: **0**.
- MariaDB Balance State Post-Concurrency:
  - Account Alpha Final Balance: **1,000,000 paise** (10,000.00 INR).
  - Account Beta Final Balance: **1,000,000 paise** (10,000.00 INR).
  - Combined System Balance: **2,000,000 paise** (20,000.00 INR).
  - **Total System Balance Delta: 0 paise.**
- MariaDB Dual-Leg Ledger Integrity:
  - Transfers Created: **20 rows**.
  - Transactions Created: **40 rows** (20 debits, 20 credits).
- Deadlock Prevention Mechanism: Verified MariaDB deterministic row locking `[sourceAccountId, destinationAccountId].sort()` with `SELECT id FROM accounts WHERE id = ? FOR UPDATE` successfully eliminated lock acquisition cycles across opposing concurrent transactions.
- **Verdict:** **PASSED**

---

### Test 6: Exact-ID Cleanup & Dynamic FK Dependency Audit

**1. Dynamic Foreign Key Dependency Graph (Queried from `INFORMATION_SCHEMA`):**
```
accounts.userId                -> users.id         [ON DELETE RESTRICT, ON UPDATE CASCADE]
transactions.accountId         -> accounts.id      [ON DELETE RESTRICT, ON UPDATE CASCADE]
transactions.userId            -> users.id         [ON DELETE RESTRICT, ON UPDATE CASCADE]
transfers.creditTransactionId  -> transactions.id  [ON DELETE RESTRICT, ON UPDATE CASCADE]
transfers.debitTransactionId   -> transactions.id  [ON DELETE RESTRICT, ON UPDATE CASCADE]
transfers.userId               -> users.id         [ON DELETE RESTRICT, ON UPDATE CASCADE]
refresh_tokens.userId          -> users.id         [ON DELETE CASCADE,  ON UPDATE CASCADE]
idempotency_records.userId     -> users.id         [ON DELETE CASCADE,  ON UPDATE CASCADE]
audit_logs.actorUserId         -> users.id         [ON DELETE SET NULL, ON UPDATE CASCADE]
audit_logs.targetUserId        -> users.id         [ON DELETE SET NULL, ON UPDATE CASCADE]
```

**2. Audit Log Immutability Verification:**
- MariaDB trigger inspection:
  - `trg_audit_logs_no_update`: `SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'audit_logs rows are immutable: UPDATE is not permitted'`
  - `trg_audit_logs_no_delete`: `SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'audit_logs rows are immutable: DELETE is not permitted'`
- 26 audit log entries generated by the test user were tracked and verified in the database.
- Per Mandatory Requirement 3, no delete statements were targeted at `audit_logs`.
- Upon user deletion, the InnoDB engine executed `ON DELETE SET NULL`, setting `actorUserId = NULL` while preserving all 26 immutable audit log rows.

**3. Exact-ID Deletion In Reverse Dependency Order:**
1. `DELETE FROM transfers WHERE id IN (...)` -> **20 rows deleted**.
2. `DELETE FROM transactions WHERE userId = ?` -> **42 rows deleted**.
3. `DELETE FROM accounts WHERE id IN (...)` -> **3 rows deleted**.
4. `DELETE FROM idempotency_records WHERE userId = ?` -> **22 rows deleted**.
5. `DELETE FROM refresh_tokens WHERE userId = ?` -> **1 row deleted**.
6. `DELETE FROM users WHERE id = ?` -> **1 row deleted**.

**4. MariaDB Residual Verification:**
- Residual Users: `SELECT COUNT(*) FROM users WHERE id = '9c5b4e45-6a70-4435-862a-f27be21bff01'` -> **0**
- Residual Accounts: `SELECT COUNT(*) FROM accounts WHERE userId = '9c5b4e45-...'` -> **0**
- Residual Transactions: `SELECT COUNT(*) FROM transactions WHERE userId = '9c5b4e45-...'` -> **0**
- Residual Transfers: `SELECT COUNT(*) FROM transfers WHERE userId = '9c5b4e45-...'` -> **0**
- Residual Idempotency Records: `SELECT COUNT(*) FROM idempotency_records WHERE userId = '9c5b4e45-...'` -> **0**
- Retained Audit Logs: `SELECT COUNT(*) FROM audit_logs WHERE id IN (...)` -> **26 (all with actorUserId = NULL)**
- **Verdict:** **PASSED (0 residual test records)**

---

## Conclusion

The production environment at `https://finance.imakshay.in` (Build `20260915-prod-remediation-v3`) running on Hostinger MariaDB demonstrates strict idempotency semantics, robust canonicalization, safe race handling, and complete immunity to deadlocks under high-concurrency opposing balance transfers. Zero schema mutations occurred, and the test suite cleaned up all test entities cleanly.
