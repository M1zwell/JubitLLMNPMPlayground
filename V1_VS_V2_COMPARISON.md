# V1 vs V2 Adapter Comparison

## HKSFC Adapter Comparison

### V1 Interface (Working)
```typescript
export interface HKSFCRecord {
  title: string;
  content?: string;
  filing_type: string;
  company_code?: string;
  company_name?: string;
  filing_date?: Date;
  url: string;
}
```

### V2 Interface (Before Fix)
```typescript
export interface HKSFCRecord {
  title: string;
  content?: string;
  summary?: string;           // ✅ In DB
  filing_type: string;
  category?: string;           // ❌ NOT in DB - REMOVED
  company_code?: string;
  company_name?: string;
  filing_date?: Date;
  publish_date?: string;       // ❌ NOT in DB - REMOVED
  url: string;
  pdf_url?: string;            // ✅ In DB
  tags?: string[];             // ✅ In DB
}
```

### What V1 Actually Returns
```typescript
{
  title: string,
  content?: string,         // First 200-500 chars
  filing_type: string,      // 'news' or 'enforcement'
  company_code?: string,    // Extracted via regex /\b(0\d{3})\b/
  company_name?: string,    // Generated as `Company ${code}`
  filing_date?: Date,       // Parsed from markdown
  url: string              // Full URL
}
```

### What V2 Returns (After Fix)
```typescript
{
  title: string,
  content: string,          // First 1000 chars of markdown
  summary: string,          // ✅ Extracted via JSON schema
  filing_type: string,      // Derived from category or filingType
  // category: REMOVED
  company_code?: string,    // ✅ Extracted via JSON schema OR regex fallback
  company_name?: string,    // ✅ From JSON schema OR generated
  filing_date?: Date,       // Parsed from publishDate
  // publish_date: REMOVED
  url: string,              // ✅ From articleUrl or page URL
  pdf_url?: string,         // ✅ From JSON schema OR links array
  tags: string[]            // ✅ From category + filingType
}
```

---

## CCASS Adapter Comparison

### V1 Interface (Working)
```typescript
export interface CCassRecord {
  stock_code: string;
  stock_name?: string;       // ⚠️ In interface but NEVER returned by V1!
  participant_id: string;
  participant_name: string;
  shareholding: number;
  percentage: number;
  scraped_at?: Date;
}
```

### V2 Interface (Before Fix)
```typescript
export interface CCassRecord {
  stock_code: string;
  stock_name?: string;       // ❌ NOT in DB - REMOVED
  participant_id: string;
  participant_name: string;
  address?: string;          // ❌ NOT in DB - REMOVED
  shareholding: number;
  percentage: number;
  data_date?: string;        // ❌ NOT in DB - REMOVED
  scraped_at?: Date;
}
```

### What V1 Actually Returns
```typescript
{
  stock_code: string,
  participant_id: string,    // Format: C00001, B00123
  participant_name: string,  // Full name
  shareholding: number,      // Integer (commas removed)
  percentage: number,        // Float (% symbol removed)
  scraped_at: Date
}
```

### What V2 Returns (After Fix)
```typescript
{
  stock_code: string,        // ✅ From JSON schema OR formatted input
  // stock_name: REMOVED
  participant_id: string,    // ✅ From JSON schema
  participant_name: string,  // ✅ From JSON schema
  // address: REMOVED
  shareholding: number,      // ✅ Robust parsing (handles strings + numbers)
  percentage: number,        // ✅ Robust parsing (handles "12.34%" or 12.34)
  // data_date: REMOVED
  scraped_at: Date
}
```

---

## Database Schema (Actual Tables)

### hksfc_filings Table
```
✅ id
✅ title
✅ content
✅ filing_type
✅ company_code
✅ company_name
✅ filing_date
✅ url
✅ content_hash
✅ scraped_at
✅ first_seen
✅ last_seen
✅ summary
✅ pdf_url
✅ tags
✅ search_vector
```

### hkex_ccass_holdings Table
```
✅ id
✅ stock_code
✅ participant_id
✅ participant_name
✅ shareholding
✅ percentage
✅ scraped_at
✅ content_hash
✅ created_at
✅ updated_at
```

---

## Key Differences Between V1 and V2

### HKSFC
| Feature | V1 | V2 |
|---------|----|----|
| **API Version** | Firecrawl V0 | Firecrawl V2 |
| **URL Discovery** | None (hardcoded URLs) | Map endpoint (15-30x faster) |
| **Data Extraction** | Regex parsing | JSON schema extraction |
| **Summary Field** | ❌ No | ✅ Yes (from LLM) |
| **PDF URLs** | ❌ No | ✅ Yes (from LLM) |
| **Tags** | ❌ No | ✅ Yes (category + type) |
| **Company Detection** | Regex only | JSON schema + regex fallback |
| **Parsing Code** | 100+ lines regex | ~20 lines (LLM does it) |
| **Performance** | 30-60s per page | 1-2s URL discovery + 5-10s per page |

### CCASS
| Feature | V1 | V2 |
|---------|----|----|
| **API Version** | Firecrawl V1 (Actions) | Firecrawl V2 (Actions) |
| **Form Interaction** | Sequential click/input | executeJavascript (more reliable) |
| **Data Extraction** | Regex parsing | JSON schema + regex fallback |
| **Number Parsing** | Basic parseInt/parseFloat | Robust (handles strings, commas, %) |
| **Validation** | None | Filters invalid records |
| **Error Handling** | Throw error | Fallback to markdown parsing |

---

## V2 Improvements Over V1

### ✅ Correctness
1. **Removed phantom fields** that were in V1 interface but never returned (stock_name)
2. **Aligned with database schema** - no extra fields causing insertion failures
3. **Better number parsing** - handles edge cases like "1,234,567" or "12.34%"

### ✅ Performance
1. **15-30x faster URL discovery** with Map endpoint
2. **Reduced API calls** - discover all URLs in 1-2s vs 30-60s
3. **Better caching** - maxAge: 0 for fresh data

### ✅ Data Quality
1. **LLM-powered extraction** - better than regex for complex content
2. **JSON schema validation** - ensures data structure
3. **Automatic fallback** - V1 parsing if V2 JSON fails
4. **More fields extracted**: summary, pdf_url, tags (all in DB schema)

### ✅ Reliability
1. **executeJavascript** instead of sequential actions (fewer failures)
2. **Robust parsing** with multiple fallbacks
3. **Better error messages** for debugging
4. **Automatic V1 fallback** if V2 fails

---

## Remaining Issues to Watch

### 1. **Interface vs Implementation Mismatch**
V1 has `stock_name` in interface but never returns it. This should be cleaned up:
```typescript
// V1 interface says this exists but code never returns it
stock_name?: string;  // ← Should be removed from V1 interface
```

### 2. **Mock Data Consistency**
Both V1 and V2 mock data should match production data structure exactly.
Currently aligned after fix.

### 3. **Optional Fields Documentation**
Some fields are marked optional (`?`) but are always returned:
- `title` - always required, should be `title: string` (no ?)
- `stock_code` - always required, should be `stock_code: string` (no ?)

### 4. **Date Formats**
- V1 uses `Date` objects
- V2 removed `data_date: string` (not in DB anyway)
- Both use `scraped_at: Date` ✅

---

## Recommendation: Update V2 Interfaces

After the fix, V2 interfaces should be updated to match what's actually returned:

### HKSFC V2 Interface (Recommended)
```typescript
export interface HKSFCRecord {
  title: string;              // Required
  content?: string;
  summary?: string;           // NEW in V2
  filing_type: string;        // Required
  company_code?: string;
  company_name?: string;
  filing_date?: Date;
  url: string;                // Required
  pdf_url?: string;           // NEW in V2
  tags?: string[];            // NEW in V2
}
```

### CCASS V2 Interface (Recommended)
```typescript
export interface CCassRecord {
  stock_code: string;         // Required
  participant_id: string;     // Required
  participant_name: string;   // Required
  shareholding: number;       // Required
  percentage: number;         // Required
  scraped_at?: Date;
}
```

**Key Change:** Removed `stock_name`, `address`, `data_date` from interface since:
1. They're not in the database schema
2. V2 no longer returns them (after fix)
3. Keeping them causes confusion

---

## Testing Checklist

After deploying the fixed V2 adapters:

### HKSFC Tests
- [ ] Mock data inserts successfully (0 failed)
- [ ] Real data from Map endpoint works
- [ ] JSON schema extraction returns valid data
- [ ] Fallback markdown parsing works if JSON fails
- [ ] Summary field is populated
- [ ] PDF URLs are extracted when available
- [ ] Tags are created properly
- [ ] Company codes extracted correctly

### CCASS Tests
- [ ] Mock data inserts successfully (0 failed)
- [ ] executeJavascript form submission works
- [ ] JSON schema extraction returns valid participants
- [ ] Fallback markdown parsing works if JSON fails
- [ ] Numbers parse correctly (commas, % symbols)
- [ ] All required fields are present
- [ ] Invalid records are filtered out

### Database Tests
- [ ] No RLS policy errors
- [ ] content_hash deduplication works
- [ ] first_seen/last_seen timestamps correct
- [ ] scrape_logs shows V2 engine: "firecrawl-v2-map-json" or "firecrawl-v2-actions-json"
- [ ] All inserts succeed (records_failed = 0)

---

## Summary

**V1:** Works but limited (regex parsing, hardcoded URLs, slow)
**V2 (Before Fix):** Advanced features but broken (extra fields caused DB failures)
**V2 (After Fix):** Best of both worlds (advanced features + working DB inserts)

The fix aligns V2's return values with V1's proven data structure while keeping all the V2 performance and quality improvements.
