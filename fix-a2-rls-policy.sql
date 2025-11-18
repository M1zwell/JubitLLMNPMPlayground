-- Add INSERT policy for a2_mktcap_by_stock_type
CREATE POLICY "Allow public insert to a2_mktcap_by_stock_type"
  ON a2_mktcap_by_stock_type
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Add UPDATE policy for a2_mktcap_by_stock_type
CREATE POLICY "Allow public update to a2_mktcap_by_stock_type"
  ON a2_mktcap_by_stock_type
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Add DELETE policy for a2_mktcap_by_stock_type
CREATE POLICY "Allow public delete to a2_mktcap_by_stock_type"
  ON a2_mktcap_by_stock_type
  FOR DELETE
  TO public
  USING (true);
