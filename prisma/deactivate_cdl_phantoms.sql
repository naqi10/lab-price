-- Deactivate CDL phantom profiles that are NOT in CDL's official catalog
-- SMA12 and TH2 are Dynacare profiles that were incorrectly seeded as CDL bundles
UPDATE bundle_deals
SET is_active = false
WHERE profile_code IN ('SMA12', 'TH2')
  AND source_lab_code = 'CDL';
