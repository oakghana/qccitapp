# Bulk Device Import Guide

## Overview
The bulk device import feature allows IT staff and regional IT heads to import multiple devices at once using a CSV file, saving time compared to adding devices one by one.

## Who Can Use This Feature?
- **Admin** users
- **IT Staff**
- **Regional IT Heads**

## How to Use

### Step 1: Download the Template
1. Click the **Bulk Import** button in the Device Inventory page header
2. Click **Download Template** to get a sample CSV file with the correct format
3. Open the template in Excel, Google Sheets, or any spreadsheet application

### Step 2: Prepare Your Data
Fill in the CSV with your device information:

#### Required Fields
- **device_type**: One of: laptop, desktop, printer, photocopier, handset, ups, stabiliser, mobile, server, other
- **brand**: Device manufacturer (e.g., Dell, HP, Lenovo)
- **model**: Device model number (e.g., Latitude 5520, LaserJet M404)
- **serial_number**: Unique serial number (must not exist in the system already)

#### Optional Fields
- **status**: active, repair, maintenance, or retired (defaults to "active" if not specified)
- **purchase_date**: Date in format YYYY-MM-DD (e.g., 2024-01-15)
- **warranty_expiry**: Date in format YYYY-MM-DD
- **assigned_to**: Name of person/department assigned to device
- **room_number**: Room location
- **building**: Building name/code
- **floor**: Floor level
- **toner_type**: Toner cartridge model (required for printers and photocopiers)
- **toner_model**: Alternative toner model field
- **toner_yield**: Toner yield information
- **monthly_print_volume**: Expected monthly print volume

### Step 3: Upload Your CSV
1. Click the **Bulk Import** button
2. Either drag and drop your CSV file or click to select it
3. The system will automatically validate your data

### Step 4: Review Validation Results
The system will:
- Check that all required fields are present
- Verify device types are valid
- Check for duplicate serial numbers
- Validate date formats
- Ensure printer/photocopier devices have toner type specified

If validation succeeds, click **Import Devices** to proceed.

If there are errors:
- Review the error list showing which rows have issues
- Click **Download Error Report** to get a CSV with detailed error information
- Fix the errors and try again

### Step 5: Automatic Location Assignment
- All imported devices are automatically assigned to your user location
- You cannot override this location during import
- This ensures data integrity and proper location tracking

## Validation Rules

### Device Type
Must be one of:
- laptop
- desktop
- printer
- photocopier
- handset
- ups
- stabiliser
- mobile
- server
- other

### Status
If provided, must be one of:
- active
- repair
- maintenance
- retired

Defaults to "active" if not specified.

### Serial Number
- Required field
- Must be unique (no duplicates in system)
- Cannot be blank

### Dates
- Must be in ISO format: YYYY-MM-DD
- Examples: 2024-01-15, 2025-12-31

### Printer/Photocopier Devices
- If device_type is "printer" or "photocopier", toner_type is required
- All other fields are optional

## Example CSV

```
device_type,brand,model,serial_number,status,purchase_date,warranty_expiry,assigned_to,room_number,building,floor,toner_type
laptop,Dell,Latitude 5520,SN12345,active,2023-01-15,2025-01-15,John Doe,204,Main Block,2nd Floor,
desktop,HP,ProDesk 400,SN12346,active,2023-02-20,2025-02-20,Admin Dept,105,Admin Building,1st Floor,
printer,HP,LaserJet M404,SN12347,active,2023-03-10,2025-03-10,Print Room,101,Main Block,Ground Floor,CF217A
server,Dell,PowerEdge R760,SN12348,active,2023-04-05,2025-04-05,IT Dept,001,Server Room,Basement,
mobile,Apple,iPhone 14,SN12349,active,2024-06-01,2026-06-01,Field Team Member,,Main Office,1st Floor,
```

## Error Handling

### Common Errors

**"Invalid device type. Must be one of: laptop, desktop, printer..."**
- Solution: Check the device_type column - it may be misspelled or use incorrect case

**"Serial number already exists in the system"**
- Solution: The serial number is already registered. Use a different serial number or update the existing device.

**"Invalid date format. Use YYYY-MM-DD"**
- Solution: Ensure dates are in the format YYYY-MM-DD (e.g., 2024-01-15, not 01/15/2024)

**"Toner type is required for printers and photocopiers"**
- Solution: Add a toner_type value for devices marked as printer or photocopier

**"[field] is required"**
- Solution: The field is empty but required. Fill in: device_type, brand, model, or serial_number

### Downloading Error Reports
If import fails:
1. Errors are displayed in the dialog
2. Click **Download Error Report** to get a CSV file with error details
3. Fix the errors using the error report as a guide
4. Try importing again

## Tips for Success

1. **Use the template** - The template has the correct column order and format
2. **Check serial numbers** - Ensure no duplicates within your CSV or existing system
3. **Use consistent device types** - Use lowercase values exactly as specified
4. **Date format** - Always use YYYY-MM-DD format for dates
5. **Review errors carefully** - The error messages tell you exactly what's wrong and which row

## What Happens After Import?

- ✅ All valid devices are added to the Device Inventory
- ✅ Each device is automatically assigned to your user location
- ✅ Devices appear with "active" status by default (unless specified)
- ✅ Devices can be edited individually after import using the Device Inventory
- ✅ A success notification confirms how many devices were imported

## Troubleshooting

**I uploaded a file but nothing happened**
- Check that you have permission (Admin, IT Staff, or Regional IT Head role)
- Ensure the file is a valid CSV format
- Try downloading the template and comparing your format

**My import is failing with "Location is required"**
- This is automatic - your location is set in your user profile
- Contact an administrator if your location is not set

**Some devices imported but others didn't**
- Only rows with valid data are imported
- Check the error report to see which rows failed and why
- Fix those rows and import again

## Support

For issues or questions about bulk import:
1. Check the validation error messages for specific guidance
2. Download the error report for detailed information
3. Contact your system administrator
