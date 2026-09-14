# Security Specification & Test Payloads

## 1. Data Invariants
- `Transaction`: Each transaction must have valid numeric `id`, valid `date` format, valid `receipt` and `payment` numbers, non-empty `accountName`, `mainAccount`, and `closingAccount`.
- `Account`: Each account must have non-empty `id`, `name`, `type`, `mainAccount`, and valid `openingBalance`.
- `UserActivityLog`: Must record valid timestamp, username, action, window, and affected record.
- `TestConnection`: Document used exclusively for connectivity verification.

## 2. Dirty Dozen Test Payloads
1. **Ghost Field Poisoning**: Transaction containing unexpected `isSuperAdmin: true` field.
2. **Type Confusion in Receipt**: Transaction containing string `"one thousand"` in `receipt`.
3. **Huge String Attack (Denial of Wallet)**: Description string > 500 characters or 100KB payload.
4. **Invalid Transaction ID Path**: Document ID containing invalid characters (`../../etc`).
5. **Missing Required Fields**: Account without `openingBalance` or `mainAccount`.
6. **Negative Sequence Counter**: UserActivityLog with sequence < 0.
7. **Invalid Movement Type**: Transaction with type `"اختلاس"` instead of `"قبض"` or `"دفع"`.
8. **Corrupted Date Format**: Date formatted as `"09/13/2026"` instead of ISO `"YYYY-MM-DD"`.
9. **Account Name Null / Blank**: Account payload with blank name `""`.
10. **Activity Log Missing Action**: Activity log missing the `action` field.
11. **Malicious Path Injection**: Account ID with traversal characters.
12. **Unauthorized Deletion**: Deletion attempt on restricted system logs.
