# AD user provisioning automation

A PowerShell script (`New-LabADUsers.ps1`) reads `users.csv` and creates any missing accounts in
`OU=LabUsers,DC=T5,DC=org`, adding group memberships (for example `VPN-Users`, which gates GlobalProtect).
It runs as a Windows Scheduled Task (`AD Lab User Provisioning`) every day at 2:00 AM. New CSV rows are
picked up on the next run. Existing users are skipped, so re-runs are idempotent. Each run writes a
transcript to `provision_log.txt`.

Evidence: [docs/evidence/README.md#identity-ad-provisioning-automation](../docs/evidence/README.md#identity-ad-provisioning-automation)

## Input schema
```csv
Username,FirstName,LastName,Password,OU,Groups
jdoe,John,Doe,<initial-password>,"OU=LabUsers,DC=T5,DC=org",
asmith,Alice,Smith,<initial-password>,"OU=LabUsers,DC=T5,DC=org","VPN-Users"
```

## Verification commands (as run)
```powershell
Get-Content "C:\Users\Administrator\Documents\Scripts\provision_log.txt" -Tail 40
Get-ScheduledTask -TaskName "AD Lab User Provisioning" | Get-ScheduledTaskInfo   # LastTaskResult 0 = success
```

## Known weakness (would not ship to production)
The lab CSV stored one shared initial password in plaintext for every account. A production version
would generate a random password per user, set `-ChangePasswordAtLogon $true`, keep secrets out of the
input file (pull them from a vault), and run the task under a gMSA instead of `T5\Administrator`.

The script source was not preserved when the lab was decommissioned. Only its outputs are archived.
