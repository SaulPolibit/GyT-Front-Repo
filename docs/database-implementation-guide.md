# Polibit Platform - Database Implementation Guide

## Overview

This guide provides complete documentation for implementing the Polibit investment management platform database schema, including migration from localStorage to PostgreSQL, API endpoint mapping, and data validation rules.

---

## 📁 Documentation Files

1. **entity-relationship-diagram.md** - Visual Mermaid ER diagram with all entities and relationships
2. **database-schema.sql** - Complete PostgreSQL schema with tables, indexes, triggers, views, and functions
3. **database-implementation-guide.md** - This file - implementation instructions and best practices

---

## 🚀 Quick Start

### 1. Database Setup

```bash
# Create PostgreSQL database
createdb polibit_platform

# Connect to database
psql -d polibit_platform

# Run schema
psql -d polibit_platform -f docs/database-schema.sql
```

### 2. Verify Installation

```sql
-- Check tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check views
SELECT table_name FROM information_schema.views
WHERE table_schema = 'public';

-- Check functions
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
```

---

## 📊 Database Schema Overview

### Core Tables (12)

| Table | Primary Entity | Records | Key Relationships |
|-------|---------------|---------|-------------------|
| `structures` | Funds/SPVs/Trusts | ~100s | Parent to investments, capital calls, distributions |
| `investors` | Limited Partners | ~1000s | Many-to-many with structures via fundOwnerships |
| `investments` | Portfolio Assets | ~100s | Belongs to structure |
| `capital_calls` | Capital Calls | ~100s | Belongs to structure, references investors |
| `distributions` | Distributions | ~100s | Belongs to structure, references investors |
| `investment_subscriptions` | Subscriptions | ~100s | Links investors to investments |
| `waterfall_tiers` | Waterfall Config | ~100s | Belongs to structure |
| `documents` | Documents | ~1000s | Polymorphic - belongs to any entity |
| `users` | Platform Users | ~10s | Internal staff users |
| `api_users` | API Users | ~1000s | External investor users |
| `kyc_sessions` | KYC Sessions | ~1000s | Belongs to api_users |
| `payments` | Payments | ~1000s | Links users to structures |

### Supporting Tables (2)

| Table | Purpose |
|-------|---------|
| `firm_settings` | Global firm configuration |
| `notification_settings` | User notification preferences |

### Views (5)

| View | Purpose |
|------|---------|
| `v_active_structures` | Active structures with investor counts |
| `v_investor_portfolio` | Investor portfolio summaries |
| `v_structure_performance` | Structure performance metrics |
| `v_capital_call_summary` | Capital call summaries |
| `v_distribution_summary` | Distribution summaries |

---

## 🔄 Data Migration from localStorage

### Migration Strategy

The current platform uses localStorage with the following keys:

```javascript
// LocalStorage Keys → PostgreSQL Tables
'polibit_structures' → structures
'polibit_investors' → investors
'polibit_investments' → investments
'polibit_capital_calls' → capital_calls
'polibit_distributions' → distributions
'polibit_investment_subscriptions' → investment_subscriptions
'polibit_users' → users
'polibit_auth' → api_users
'polibit_firm_settings' → firm_settings
'polibit_notification_settings' → notification_settings
```

### Migration Script Template

```javascript
// Example migration script (Node.js)
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  host: 'localhost',
  database: 'polibit_platform',
  user: 'postgres',
  password: 'your_password',
  port: 5432
});

async function migrateStructures() {
  // Read from localStorage backup
  const structures = JSON.parse(
    fs.readFileSync('localStorage-backup/structures.json', 'utf8')
  );

  for (const structure of structures) {
    await pool.query(`
      INSERT INTO structures (
        id, name, type, subtype, jurisdiction, total_commitment,
        currency, investors, status, created_date, inception_date,
        management_fee, performance_fee, hurdle_rate, preferred_return,
        waterfall_structure, planned_investments, financing_strategy,
        determined_tier, calculated_issuances, hierarchy_mode,
        parent_structure_id, hierarchy_level, hierarchy_path,
        current_nav, nav_history
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW()
    `, [
      structure.id,
      structure.name,
      structure.type,
      structure.subtype,
      structure.jurisdiction,
      structure.totalCommitment,
      structure.currency,
      structure.investors,
      structure.status,
      structure.createdDate,
      structure.inceptionDate,
      structure.managementFee,
      structure.performanceFee,
      structure.hurdleRate,
      structure.preferredReturn,
      structure.waterfallStructure,
      structure.plannedInvestments,
      structure.financingStrategy,
      structure.determinedTier,
      structure.calculatedIssuances,
      structure.hierarchyMode || false,
      structure.parentStructureId || null,
      structure.hierarchyLevel || 1,
      JSON.stringify(structure.hierarchyPath || []),
      structure.currentNav,
      JSON.stringify(structure.navHistory || [])
    ]);
  }

  console.log(`Migrated ${structures.length} structures`);
}

async function migrateInvestors() {
  const investors = JSON.parse(
    fs.readFileSync('localStorage-backup/investors.json', 'utf8')
  );

  for (const investor of investors) {
    await pool.query(`
      INSERT INTO investors (
        id, name, email, phone, type, status,
        entity_name, entity_type, contact_first_name, contact_last_name,
        fund_ownerships, custom_terms, current_value, unrealized_gain,
        total_distributed, net_cash_flow, irr, tax_id, k1_status,
        address, preferred_contact_method, notes, documents,
        investor_since, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
      )
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW()
    `, [
      investor.id,
      investor.name,
      investor.email,
      investor.phone,
      investor.type,
      investor.status,
      investor.entityName,
      investor.entityType,
      investor.contactFirstName,
      investor.contactLastName,
      JSON.stringify(investor.fundOwnerships || []),
      JSON.stringify(investor.customTerms || {}),
      investor.currentValue || 0,
      investor.unrealizedGain || 0,
      investor.totalDistributed || 0,
      investor.netCashFlow || 0,
      investor.irr || 0,
      investor.taxId,
      investor.k1Status || 'Not Generated',
      JSON.stringify(investor.address || {}),
      investor.preferredContactMethod || 'Email',
      investor.notes || '',
      JSON.stringify(investor.documents || []),
      investor.investorSince,
      investor.createdAt,
      investor.updatedAt
    ]);
  }

  console.log(`Migrated ${investors.length} investors`);
}

// Run migrations
async function runMigrations() {
  try {
    await migrateStructures();
    await migrateInvestors();
    // Add more migration functions...
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigrations();
```

---

## 🔗 API Endpoint to Database Mapping

### Structures

| Endpoint | Method | SQL Operation | Table |
|----------|--------|---------------|-------|
| `/api/structures` | GET | `SELECT * FROM structures` | structures |
| `/api/structures/:id` | GET | `SELECT * FROM structures WHERE id = $1` | structures |
| `/api/structures` | POST | `INSERT INTO structures` | structures |
| `/api/structures/:id` | PATCH | `UPDATE structures WHERE id = $1` | structures |
| `/api/structures/:id/with-investors` | GET | `JOIN with investors via fund_ownerships` | structures, investors |

### Investors

| Endpoint | Method | SQL Operation | Table |
|----------|--------|---------------|-------|
| `/api/investors` | GET | `SELECT * FROM investors` | investors |
| `/api/investors/:id` | GET | `SELECT * FROM investors WHERE id = $1` | investors |
| `/api/investors` | POST | `INSERT INTO investors` | investors |
| `/api/investors/:id` | PATCH | `UPDATE investors WHERE id = $1` | investors |
| `/api/investors/:id/portfolio` | GET | `SELECT * FROM v_investor_portfolio` | v_investor_portfolio |

### Investments

| Endpoint | Method | SQL Operation | Table |
|----------|--------|---------------|-------|
| `/api/investments` | GET | `SELECT * FROM investments` | investments |
| `/api/investments/:id` | GET | `SELECT * FROM investments WHERE id = $1` | investments |
| `/api/investments` | POST | `INSERT INTO investments` | investments |
| `/api/investments/:id` | PATCH | `UPDATE investments WHERE id = $1` | investments |
| `/api/investments/portfolio/structure/:id/summary` | GET | `SELECT * FROM v_structure_performance` | v_structure_performance |

### Capital Calls

| Endpoint | Method | SQL Operation | Table |
|----------|--------|---------------|-------|
| `/api/capital-calls` | GET | `SELECT * FROM capital_calls` | capital_calls |
| `/api/capital-calls/:id` | GET | `SELECT * FROM capital_calls WHERE id = $1` | capital_calls |
| `/api/capital-calls` | POST | `INSERT INTO capital_calls` | capital_calls |
| `/api/capital-calls/:id` | PATCH | `UPDATE capital_calls WHERE id = $1` | capital_calls |
| `/api/capital-calls/:id/update-payment` | PATCH | `UPDATE capital_calls SET investor_allocations = ...` | capital_calls |

### Distributions

| Endpoint | Method | SQL Operation | Table |
|----------|--------|---------------|-------|
| `/api/distributions` | GET | `SELECT * FROM distributions` | distributions |
| `/api/distributions/:id` | GET | `SELECT * FROM distributions WHERE id = $1` | distributions |
| `/api/distributions` | POST | `INSERT INTO distributions` | distributions |
| `/api/distributions/:id` | PATCH | `UPDATE distributions WHERE id = $1` | distributions |
| `/api/distributions/:id/apply-waterfall` | POST | `UPDATE distributions + waterfall calculation` | distributions, waterfall_tiers |

---

## ✅ Data Validation Rules

### Structure Validation

```sql
-- Check investor capacity
CREATE OR REPLACE FUNCTION validate_structure_investor_capacity(structure_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    max_investors INTEGER;
    current_count INTEGER;
BEGIN
    SELECT investors INTO max_investors
    FROM structures WHERE id = structure_uuid;

    SELECT get_structure_investor_count(structure_uuid) INTO current_count;

    RETURN current_count <= max_investors;
END;
$$ LANGUAGE plpgsql;

-- Check investment capacity
CREATE OR REPLACE FUNCTION validate_structure_investment_capacity(structure_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    max_investments INTEGER;
    current_count INTEGER;
BEGIN
    SELECT planned_investments::integer INTO max_investments
    FROM structures WHERE id = structure_uuid;

    SELECT get_structure_investment_count(structure_uuid) INTO current_count;

    RETURN current_count <= max_investments;
END;
$$ LANGUAGE plpgsql;

-- Check issuance capacity
CREATE OR REPLACE FUNCTION validate_structure_issuance_capacity(structure_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    max_issuances INTEGER;
    current_count INTEGER;
BEGIN
    SELECT calculated_issuances INTO max_issuances
    FROM structures WHERE id = structure_uuid;

    SELECT get_structure_issuance_count(structure_uuid) INTO current_count;

    RETURN current_count <= max_issuances;
END;
$$ LANGUAGE plpgsql;
```

### Investment Validation

```sql
-- Validate investment positions based on type
CREATE OR REPLACE FUNCTION validate_investment_positions()
RETURNS TRIGGER AS $$
BEGIN
    -- EQUITY: must have equity position, no debt position
    IF NEW.investment_type = 'EQUITY' THEN
        IF NEW.fund_equity_position IS NULL THEN
            RAISE EXCEPTION 'EQUITY investment must have fund_equity_position';
        END IF;
        IF NEW.fund_debt_position IS NOT NULL THEN
            RAISE EXCEPTION 'EQUITY investment cannot have fund_debt_position';
        END IF;
    END IF;

    -- DEBT: must have debt position, no equity position
    IF NEW.investment_type = 'DEBT' THEN
        IF NEW.fund_debt_position IS NULL THEN
            RAISE EXCEPTION 'DEBT investment must have fund_debt_position';
        END IF;
        IF NEW.fund_equity_position IS NOT NULL THEN
            RAISE EXCEPTION 'DEBT investment cannot have fund_equity_position';
        END IF;
    END IF;

    -- MIXED: must have both positions
    IF NEW.investment_type = 'MIXED' THEN
        IF NEW.fund_equity_position IS NULL OR NEW.fund_debt_position IS NULL THEN
            RAISE EXCEPTION 'MIXED investment must have both equity and debt positions';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_investment_positions
    BEFORE INSERT OR UPDATE ON investments
    FOR EACH ROW
    EXECUTE FUNCTION validate_investment_positions();
```

### Investor Validation

```sql
-- Validate entity fields based on investor type
CREATE OR REPLACE FUNCTION validate_investor_entity_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Non-individual investors must have entity fields
    IF NEW.type != 'individual' THEN
        IF NEW.entity_name IS NULL OR
           NEW.contact_first_name IS NULL OR
           NEW.contact_last_name IS NULL THEN
            RAISE EXCEPTION 'Non-individual investors must have entity_name, contact_first_name, and contact_last_name';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_investor_entity_fields
    BEFORE INSERT OR UPDATE ON investors
    FOR EACH ROW
    EXECUTE FUNCTION validate_investor_entity_fields();
```

---

## 🔍 Common Queries

### Get Structure with Investors

```sql
SELECT
    s.*,
    json_agg(
        json_build_object(
            'investorId', i.id,
            'investorName', i.name,
            'investorEmail', i.email,
            'investorType', i.type,
            'fundOwnership', fo.*
        )
    ) as investors
FROM structures s
LEFT JOIN investors i ON TRUE
LEFT JOIN LATERAL jsonb_to_recordset(i.fund_ownerships) AS fo(
    "fundId" text,
    "fundName" text,
    commitment numeric,
    "ownershipPercent" numeric,
    "calledCapital" numeric,
    "uncalledCapital" numeric,
    "investedDate" text
) ON fo."fundId"::uuid = s.id
WHERE s.id = $1
GROUP BY s.id;
```

### Get Investor Portfolio

```sql
SELECT
    i.*,
    json_agg(
        json_build_object(
            'structure', s.*,
            'ownership', fo.*
        )
    ) as structures
FROM investors i
LEFT JOIN LATERAL jsonb_to_recordset(i.fund_ownerships) AS fo(
    "fundId" text,
    "fundName" text,
    commitment numeric,
    "ownershipPercent" numeric,
    "calledCapital" numeric,
    "uncalledCapital" numeric
) ON TRUE
LEFT JOIN structures s ON s.id = fo."fundId"::uuid
WHERE i.id = $1
GROUP BY i.id;
```

### Get Capital Call with Allocations

```sql
SELECT
    cc.*,
    json_agg(
        json_build_object(
            'investor', i.*,
            'allocation', alloc.*
        )
    ) as allocations
FROM capital_calls cc
LEFT JOIN LATERAL jsonb_to_recordset(cc.investor_allocations) AS alloc(
    "investorId" text,
    "investorName" text,
    "callAmount" numeric,
    status text,
    "amountPaid" numeric,
    "amountOutstanding" numeric
) ON TRUE
LEFT JOIN investors i ON i.id = alloc."investorId"::uuid
WHERE cc.id = $1
GROUP BY cc.id;
```

### Get Structure Performance

```sql
SELECT
    s.id,
    s.name,
    s.type,
    s.total_commitment,
    COUNT(DISTINCT inv.id) as investment_count,
    SUM(inv.fund_commitment) as total_invested,
    SUM((inv.total_fund_position->>'currentValue')::decimal) as current_value,
    SUM((inv.total_fund_position->>'unrealizedGain')::decimal) as unrealized_gain,
    AVG((inv.total_fund_position->>'irr')::decimal) as avg_irr,
    AVG((inv.total_fund_position->>'multiple')::decimal) as avg_multiple
FROM structures s
LEFT JOIN investments inv ON inv.fund_id = s.id AND inv.status = 'Active'
WHERE s.id = $1
GROUP BY s.id, s.name, s.type, s.total_commitment;
```

---

## 🛡️ Security Best Practices

### Row-Level Security (RLS)

```sql
-- Enable RLS on sensitive tables
ALTER TABLE investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see data for their firm
CREATE POLICY user_firm_isolation ON investors
    USING (
        -- Add your firm isolation logic here
        -- Example: firm_id = current_setting('app.current_firm_id')::uuid
        TRUE
    );
```

### API User Roles

```sql
-- Create database roles
CREATE ROLE polibit_admin;
CREATE ROLE polibit_fund_manager;
CREATE ROLE polibit_operations;
CREATE ROLE polibit_read_only;
CREATE ROLE polibit_investor;

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO polibit_admin;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO polibit_fund_manager;
GRANT SELECT, INSERT, UPDATE ON capital_calls, distributions TO polibit_operations;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO polibit_read_only;
GRANT SELECT ON v_investor_portfolio TO polibit_investor;
```

---

## 📈 Performance Optimization

### Indexing Strategy

```sql
-- Add composite indexes for common queries
CREATE INDEX idx_investments_fund_status ON investments(fund_id, status);
CREATE INDEX idx_capital_calls_fund_status ON capital_calls(fund_id, status);
CREATE INDEX idx_distributions_fund_status ON distributions(fund_id, status);

-- Add covering indexes for frequently accessed columns
CREATE INDEX idx_structures_covering ON structures(id, name, type, status, total_commitment);

-- Partial indexes for active records only
CREATE INDEX idx_active_structures ON structures(id) WHERE status = 'active';
CREATE INDEX idx_active_investors ON investors(id) WHERE status = 'Active';
CREATE INDEX idx_active_investments ON investments(id) WHERE status = 'Active';
```

### Query Optimization

```sql
-- Use EXPLAIN ANALYZE to check query performance
EXPLAIN ANALYZE
SELECT * FROM v_structure_performance WHERE structure_id = 'xxx';

-- Add materialized views for expensive queries
CREATE MATERIALIZED VIEW mv_structure_performance AS
SELECT * FROM v_structure_performance;

-- Refresh materialized view periodically
REFRESH MATERIALIZED VIEW mv_structure_performance;

-- Create index on materialized view
CREATE INDEX idx_mv_structure_performance_id ON mv_structure_performance(structure_id);
```

---

## 🔄 Backup & Recovery

### Backup Strategy

```bash
# Full database backup
pg_dump polibit_platform > backup_$(date +%Y%m%d_%H%M%S).sql

# Schema-only backup
pg_dump --schema-only polibit_platform > schema_backup.sql

# Data-only backup
pg_dump --data-only polibit_platform > data_backup.sql

# Specific tables backup
pg_dump -t structures -t investors polibit_platform > core_tables_backup.sql
```

### Restore

```bash
# Restore full database
psql polibit_platform < backup_20250130_120000.sql

# Restore specific table
psql polibit_platform -c "TRUNCATE structures CASCADE;"
pg_restore -t structures backup_20250130_120000.sql
```

---

## 🧪 Testing

### Sample Test Data

```sql
-- Insert test structure
INSERT INTO structures (name, type, subtype, jurisdiction, total_commitment, currency, investors, status)
VALUES ('Test Fund I', 'fund', 'Real Estate Fund', 'United States', 10000000, 'USD', 50, 'active')
RETURNING id;

-- Insert test investor
INSERT INTO investors (name, email, type, status, fund_ownerships)
VALUES (
    'Test Investor',
    'test@example.com',
    'individual',
    'Active',
    '[{"fundId": "xxx", "fundName": "Test Fund I", "commitment": 100000, "ownershipPercent": 1.0}]'::jsonb
);

-- Insert test investment
INSERT INTO investments (
    name, type, status, sector, investment_type,
    geography, fund_equity_position, total_fund_position,
    fund_id, acquisition_date, last_valuation_date, description
)
VALUES (
    'Test Property',
    'Real Estate',
    'Active',
    'Multifamily',
    'EQUITY',
    '{"city": "Austin", "state": "Texas", "country": "United States"}'::jsonb,
    '{"ownershipPercent": 50, "equityInvested": 500000, "currentEquityValue": 600000, "unrealizedGain": 100000}'::jsonb,
    '{"totalInvested": 500000, "currentValue": 600000, "unrealizedGain": 100000, "irr": 15.5, "multiple": 1.2}'::jsonb,
    'xxx', -- fund_id
    '2024-01-01',
    '2025-01-01',
    'Test real estate investment'
);
```

---

## 📚 Additional Resources

### Documentation
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JSONB Functions](https://www.postgresql.org/docs/current/functions-json.html)
- [GIN Indexes](https://www.postgresql.org/docs/current/gin-intro.html)
- [Row-Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

### Tools
- **pgAdmin** - GUI for PostgreSQL management
- **DBeaver** - Universal database tool
- **Postico** - Modern PostgreSQL client for Mac
- **pg_stat_statements** - Query performance monitoring

---

## ✅ Implementation Checklist

- [ ] Install PostgreSQL 14+
- [ ] Create database: `polibit_platform`
- [ ] Run schema: `database-schema.sql`
- [ ] Verify tables, views, functions created
- [ ] Configure connection pooling (pg_bouncer or built-in)
- [ ] Set up backup strategy (pg_dump cron job)
- [ ] Migrate data from localStorage
- [ ] Update API endpoints to use PostgreSQL
- [ ] Implement Row-Level Security (RLS)
- [ ] Configure database roles and permissions
- [ ] Add monitoring (pg_stat_statements, slow query log)
- [ ] Set up replication (if needed)
- [ ] Performance testing with production-like data
- [ ] Load testing API endpoints
- [ ] Document database access credentials
- [ ] Train team on new schema

---

## 🎯 Next Steps

1. **Phase 1: Setup** (Week 1)
   - Install PostgreSQL
   - Run schema migration
   - Verify structure

2. **Phase 2: Data Migration** (Week 2)
   - Export localStorage data
   - Transform data format
   - Import to PostgreSQL
   - Validate data integrity

3. **Phase 3: API Integration** (Week 3-4)
   - Update API endpoints
   - Add database queries
   - Implement caching
   - Test endpoints

4. **Phase 4: Testing** (Week 5)
   - Unit tests
   - Integration tests
   - Load testing
   - Performance tuning

5. **Phase 5: Deployment** (Week 6)
   - Deploy to staging
   - User acceptance testing
   - Deploy to production
   - Monitor performance

---

**Generated:** 2025-11-30
**Version:** 1.0
**Database:** PostgreSQL 14+
