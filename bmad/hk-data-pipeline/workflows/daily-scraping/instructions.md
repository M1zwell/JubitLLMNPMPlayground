# Daily Scraping Workflow Instructions

<workflow>

<step n="1" goal="Initialize scraping session">
<action>Load configuration from {config_source}</action>
<action>Verify all required variables are set: enabled_sources, tracked_stocks, alert_email</action>
<action>Log session start time</action>
<action>Display: "Starting daily scraping for enabled sources: {enabled_sources}"</action>
</step>

<step n="2" goal="Scrape enabled sources">

<check if="hkex in enabled_sources">
  <action>Call Edge Function: {supabase_url}/functions/v1/unified-scraper</action>
  <action>Method: POST</action>
  <action>Headers: {"Content-Type": "application/json", "Authorization": "Bearer {supabase_anon_key}"}</action>
  <action>Body: {"source":"hkex", "limit":100, "test_mode":false}</action>
  <action>Store response: hkex_results</action>
  <action>Log: HKEX scraping completed - {hkex_results.records_inserted} new, {hkex_results.records_updated} updated, {hkex_results.records_failed} failed</action>
</check>

<check if="hksfc in enabled_sources">
  <action>Call Edge Function: {supabase_url}/functions/v1/unified-scraper</action>
  <action>Method: POST</action>
  <action>Headers: {"Content-Type": "application/json", "Authorization": "Bearer {supabase_anon_key}"}</action>
  <action>Body: {"source":"hksfc", "limit":100, "test_mode":false}</action>
  <action>Store response: hksfc_results</action>
  <action>Log: HKSFC scraping completed - {hksfc_results.records_inserted} new, {hksfc_results.records_updated} updated, {hksfc_results.records_failed} failed</action>
</check>

<check if="npm in enabled_sources">
  <action>Call Edge Function: {supabase_url}/functions/v1/npm-import</action>
  <action>Method: POST</action>
  <action>Headers: {"Content-Type": "application/json", "Authorization": "Bearer {supabase_anon_key}"}</action>
  <action>Body: {"searchQuery": "popular", "limit": 100, "pages": 1, "importType": "daily_batch"}</action>
  <action>Store response: npm_results</action>
  <action>Log: NPM scraping completed - {npm_results.packagesProcessed} processed, {npm_results.packagesAdded} added, {npm_results.packagesUpdated} updated</action>
</check>

<check if="llm in enabled_sources">
  <action>Call Edge Function: {supabase_url}/functions/v1/llm-update</action>
  <action>Method: POST</action>
  <action>Headers: {"Content-Type": "application/json", "Authorization": "Bearer {supabase_anon_key}"}</action>
  <action>Body: {"update_type": "daily_batch", "force_refresh": false}</action>
  <action>Store response: llm_results</action>
  <action>Log: LLM scraping completed - {llm_results.stats.models_updated} updated, {llm_results.stats.models_added} added, {llm_results.stats.total_processed} total</action>
  <action>Note: LLM update function currently has deployment issues - may need investigation</action>
</check>

</step>

<step n="3" goal="Calculate metrics and check thresholds">
<action>Calculate total_records = sum of all records_inserted + records_updated</action>
<action>Calculate total_failures = sum of all failures from each source</action>
<action>Calculate failure_rate = (total_failures / total_attempts) * 100</action>

<check if="failure_rate > failure_threshold">
  <action>Set alert_level = "WARNING"</action>
  <action>Set alert_message = "Failure rate ({failure_rate}%) exceeds threshold ({failure_threshold}%)"</action>
</check>

<check if="total_records == 0">
  <action>Set alert_level = "CRITICAL"</action>
  <action>Set alert_message = "No records scraped from any source"</action>
</check>

<check if="no alert_level set">
  <action>Set alert_level = "SUCCESS"</action>
  <action>Set alert_message = "Daily scraping completed successfully"</action>
</check>

</step>

<step n="4" goal="Generate and send email report">
<action>Compose email report with the following structure:</action>

<action>
Subject: [HK Data Pipeline] Daily Scraping Report - {alert_level}

Body:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HK DATA PIPELINE - DAILY SCRAPING REPORT
Date: {current_date}
Status: {alert_level}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUMMARY:
{alert_message}

RESULTS BY SOURCE:

📊 HKEX
   ✅ New: {hkex_results.records_inserted}
   🔄 Updated: {hkex_results.records_updated}
   ❌ Failed: {hkex_results.records_failed}
   ⏱️ Duration: {hkex_results.duration_ms}ms

📰 HKSFC
   ✅ New: {hksfc_results.records_inserted}
   🔄 Updated: {hksfc_results.records_updated}
   ❌ Failed: {hksfc_results.records_failed}
   ⏱️ Duration: {hksfc_results.duration_ms}ms

📦 NPM
   📊 Processed: {npm_results.packagesProcessed}
   ➕ Added: {npm_results.packagesAdded}
   🔄 Updated: {npm_results.packagesUpdated}

🤖 LLM Models
   ✅ Updated: {llm_results.stats.models_updated}
   ➕ New: {llm_results.stats.models_added}
   📊 Total: {llm_results.stats.total_processed}

METRICS:
- Total Records: {total_records}
- Failure Rate: {failure_rate}%
- Session Duration: {session_duration}

Next Scraping: Tomorrow at {scraping_schedule}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
View data: https://chathogs.com (HK Scraper)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
</action>

<action>Send email to {alert_email}</action>
<action>Note: Email sending requires SMTP configuration or email service integration</action>
<action>For now: Display email content and indicate where to configure email sending</action>

</step>

<step n="5" goal="Log completion and cleanup">
<action>Log workflow completion to Supabase (if logging table exists)</action>
<action>Display summary: "Daily scraping workflow completed. Report sent to {alert_email}"</action>
<action>Return status: {alert_level}</action>
</step>

</workflow>
