# Database Migration Instructions

## Issue Fixed

The error `ERROR: 55P04: unsafe use of new value "service_desk_accra" of enum type user_role` occurs because PostgreSQL doesn't allow using newly added enum values within the same transaction.

## Solution: Two-Step Migration

The migration has been split into two scripts that **must be run separately**:

### Step 1: Run the enum values script
Execute `scripts/013a_add_enum_values.sql` in Supabase SQL Editor:

\`\`\`sql
-- Run this FIRST and wait for it to complete
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'regional_it_head';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'staff';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'service_desk_accra';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'service_desk_kumasi';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'service_desk_takoradi';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'service_desk_tema';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'service_desk_sunyani';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'service_desk_cape_coast';
\`\`\`

Wait for this to complete successfully.

### Step 2: Run the comprehensive update script
Execute `scripts/013b_comprehensive_update.sql` in Supabase SQL Editor.

This creates all the tables, functions, triggers, and RLS policies.

## What Gets Created

### New Tables:
- `regions` - Ghana regions
- `districts` - Districts within regions
- `locations` - Enhanced locations with Takoradi Port
- `requisitions` - Requisition headers with approval workflow
- `requisition_items` - Line items for requisitions
- `requisition_approvals` - Approval history
- `stock_allocations` - Allocation from Central Store to regions
- `allocation_items` - Items in allocations
- `stock_transactions` - Audit trail for all stock movements
- `toner_usage` - Toner installation and replacement tracking
- `notifications` - User notifications
- `pdf_uploads` - IT document uploads
- `pdf_confirmations` - Confirmation tracking
- `repair_tasks` - Service provider repair assignments
- `service_ticket_updates` - Service ticket history

### New Columns Added to Existing Tables:
- `profiles`: status, is_approved, must_change_password, password_hash, region_id, district_id, etc.
- `devices`: asset_tag, category, region_id, district_id, location_id, warranty_end, etc.
- `service_tickets`: ticket_number, region_id, device_id, assigned_to, sla_due_date, etc.

### Helper Functions:
- `generate_requisition_number()` - Auto-generates REQ-YYYY-000001 format
- `generate_allocation_number()` - Auto-generates AL2026-000001 format
- `generate_transaction_number()` - Auto-generates TX20260117-00001 format
- `generate_repair_task_number()` - Auto-generates RT2026-00001 format
- `set_requisition_approval_routing()` - Auto-sets approval requirements based on requester role
- `record_allocation_transaction()` - Auto-records stock transactions when allocations are confirmed

### New User Roles Added:
- `regional_it_head` - Regional IT Head
- `staff` - General staff (default for self-registration)
- `service_desk_accra` - Service desk at Accra
- `service_desk_kumasi` - Service desk at Kumasi
- `service_desk_takoradi` - Service desk at Takoradi
- `service_desk_tema` - Service desk at Tema
- `service_desk_sunyani` - Service desk at Sunyani
- `service_desk_cape_coast` - Service desk at Cape Coast

### Seed Data:
- 8 regions (Greater Accra, Ashanti, Western, etc.)
- 17 locations including Takoradi Port
