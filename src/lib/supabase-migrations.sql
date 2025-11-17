-- Add loan_eligibility_override column to members table
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS loan_eligibility_override BOOLEAN DEFAULT false;

-- Add comment explaining the column
COMMENT ON COLUMN members.loan_eligibility_override IS 'Super admin override to bypass 6-month loan eligibility requirement';
