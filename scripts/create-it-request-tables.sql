-- Create Maintenance and Repairs Requests Table
CREATE TABLE IF NOT EXISTS maintenance_repair_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number VARCHAR(50) NOT NULL UNIQUE,
  
  -- Section A: Requesting Staff Information
  staff_name VARCHAR(255) NOT NULL,
  department_name VARCHAR(255) NOT NULL,
  complaints_from_users TEXT,
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  staff_signature VARCHAR(255),
  staff_user_id UUID REFERENCES profiles(id),
  
  -- Section B: Technician Use Only (Initial Diagnosis)
  diagnosis_items JSONB DEFAULT '[]', -- Array of {part_item, make_serial_no, fault_remarks}
  other_comments TEXT,
  hardware_supervisor_name VARCHAR(255),
  hardware_supervisor_signature VARCHAR(255),
  hardware_supervisor_date DATE,
  hardware_supervisor_id UUID REFERENCES profiles(id),
  
  -- Repair History
  date_of_last_repairs DATE,
  date_of_purchase DATE,
  times_repaired INTEGER DEFAULT 0,
  
  -- Section C: Authorization from Head of Department
  sectional_head_name VARCHAR(255),
  sectional_head_date DATE,
  sectional_head_signature VARCHAR(255),
  sectional_head_id UUID REFERENCES profiles(id),
  
  -- Section D: IS Manager/Office Use Only
  confirmed_by VARCHAR(255),
  confirmed_date DATE,
  confirmed_signature VARCHAR(255),
  confirmed_by_id UUID REFERENCES profiles(id),
  
  -- After Repairs Section
  gadget_working_status VARCHAR(50) CHECK (gadget_working_status IN ('working_perfectly', 'same_bad_condition', NULL)),
  after_repair_confirmed_by VARCHAR(255),
  after_repair_confirmed_date DATE,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_technician', 'diagnosed', 'pending_hod', 'hod_approved', 'pending_manager', 'manager_confirmed', 'sent_for_repair', 'repaired', 'confirmed_working', 'rejected')),
  location VARCHAR(255),
  region_id UUID REFERENCES regions(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create New IT Gadget Request Table
CREATE TABLE IF NOT EXISTS new_gadget_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number VARCHAR(50) NOT NULL UNIQUE,
  
  -- Section A: Requesting Staff Information
  staff_name VARCHAR(255) NOT NULL,
  department_name VARCHAR(255) NOT NULL,
  complaints_from_users TEXT,
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  staff_signature VARCHAR(255),
  staff_user_id UUID REFERENCES profiles(id),
  
  -- Section B: Previous IT Gadget History
  gadget_make VARCHAR(255),
  serial_number VARCHAR(255),
  year_of_purchase INTEGER,
  other_comments TEXT,
  history_recorded_by VARCHAR(255),
  history_recorded_by_id UUID REFERENCES profiles(id),
  
  -- Section C: Authorization from Head of Department
  departmental_head_name VARCHAR(255),
  departmental_head_date DATE,
  departmental_head_signature VARCHAR(255),
  departmental_head_id UUID REFERENCES profiles(id),
  
  -- Section D: IS Manager/Office Use Only
  recommended BOOLEAN,
  confirmed_by VARCHAR(255),
  confirmed_date DATE,
  confirmed_signature VARCHAR(255),
  confirmed_by_id UUID REFERENCES profiles(id),
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_history', 'history_recorded', 'pending_hod', 'hod_approved', 'pending_manager', 'recommended', 'not_recommended', 'gadget_issued', 'rejected')),
  location VARCHAR(255),
  region_id UUID REFERENCES regions(id),
  
  -- If gadget is issued
  issued_gadget_details JSONB,
  issued_date DATE,
  issued_by VARCHAR(255),
  issued_by_id UUID REFERENCES profiles(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_maintenance_repair_requests_status ON maintenance_repair_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_repair_requests_staff ON maintenance_repair_requests(staff_user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_repair_requests_date ON maintenance_repair_requests(request_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_repair_requests_department ON maintenance_repair_requests(department_name);

CREATE INDEX IF NOT EXISTS idx_new_gadget_requests_status ON new_gadget_requests(status);
CREATE INDEX IF NOT EXISTS idx_new_gadget_requests_staff ON new_gadget_requests(staff_user_id);
CREATE INDEX IF NOT EXISTS idx_new_gadget_requests_date ON new_gadget_requests(request_date);
CREATE INDEX IF NOT EXISTS idx_new_gadget_requests_department ON new_gadget_requests(department_name);
