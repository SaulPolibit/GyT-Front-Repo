-- ============================================================================
-- Polibit Investment Management Platform - PostgreSQL Database Schema
-- ============================================================================
-- Version: 1.0
-- Database: PostgreSQL 14+
-- Features: UUID, JSONB, Arrays, Triggers, Indexes
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE ENTITIES
-- ============================================================================

-- ============================================================================
-- TABLE: users
-- Description: Platform users (admin, fund managers, operations, read-only)
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'fund-manager', 'operations', 'read-only')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    profile_image TEXT,
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- ============================================================================
-- TABLE: api_users
-- Description: API authentication users with KYC integration
-- ============================================================================
CREATE TABLE api_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    app_language VARCHAR(10) NOT NULL DEFAULT 'en',
    profile_image TEXT,
    role INTEGER NOT NULL CHECK (role IN (0, 1, 2, 3)), -- 0=root, 1=admin, 2=staff, 3=customer
    address TEXT,
    country VARCHAR(100),
    kyc_id UUID,
    kyc_status VARCHAR(50),
    kyc_url TEXT,
    last_login TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_api_users_email ON api_users(email);
CREATE INDEX idx_api_users_role ON api_users(role);
CREATE INDEX idx_api_users_kyc_status ON api_users(kyc_status);

-- ============================================================================
-- TABLE: kyc_sessions
-- Description: KYC/KYB verification sessions (DiDit integration)
-- ============================================================================
CREATE TABLE kyc_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES api_users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL UNIQUE,
    provider VARCHAR(50) NOT NULL DEFAULT 'didit',
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'expired')),
    verification_data JSONB,
    pdf_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP,
    expires_at TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_kyc_sessions_user_id ON kyc_sessions(user_id);
CREATE INDEX idx_kyc_sessions_session_id ON kyc_sessions(session_id);
CREATE INDEX idx_kyc_sessions_status ON kyc_sessions(status);

-- ============================================================================
-- TABLE: structures
-- Description: Investment structures (Funds, SPVs, Trusts, Private Debt)
-- ============================================================================
CREATE TABLE structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('fund', 'sa', 'fideicomiso', 'private-debt')),
    subtype VARCHAR(100) NOT NULL,
    jurisdiction VARCHAR(100) NOT NULL,
    total_commitment DECIMAL(20, 2) NOT NULL CHECK (total_commitment > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    investors INTEGER NOT NULL CHECK (investors > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'fundraising', 'closed', 'liquidated')),

    -- Dates
    created_date TIMESTAMP NOT NULL DEFAULT NOW(),
    inception_date DATE,

    -- Fund Details
    current_stage VARCHAR(100),
    fund_term VARCHAR(50),
    fund_type VARCHAR(100),
    min_check_size DECIMAL(20, 2),
    max_check_size DECIMAL(20, 2),

    -- Economic Terms
    economic_terms_application VARCHAR(100),
    distribution_model VARCHAR(100),
    management_fee VARCHAR(50),
    performance_fee VARCHAR(50),
    hurdle_rate VARCHAR(50),
    preferred_return VARCHAR(50),
    waterfall_structure VARCHAR(100),
    waterfall_scenarios JSONB,
    distribution_frequency VARCHAR(50),
    default_tax_rate VARCHAR(50),

    -- Debt Specific
    debt_interest_rate VARCHAR(50),
    debt_gross_interest_rate VARCHAR(50),

    -- Capacity Planning
    planned_investments VARCHAR(50),
    financing_strategy VARCHAR(50) CHECK (financing_strategy IN ('equity', 'debt', 'mixed', NULL)),
    equity_subtype VARCHAR(100),
    debt_subtype VARCHAR(100),

    -- Geography
    us_state VARCHAR(50),
    us_state_other VARCHAR(100),

    -- Capital Call Defaults
    capital_call_notice_period VARCHAR(50),
    capital_call_default_percentage VARCHAR(50),
    capital_call_payment_deadline VARCHAR(50),

    -- Tokenization
    determined_tier VARCHAR(50) CHECK (determined_tier IN ('starter', 'growth', 'enterprise', 'custom', NULL)),
    calculated_issuances INTEGER,
    token_name VARCHAR(100),
    token_symbol VARCHAR(20),
    token_value DECIMAL(20, 2),
    total_tokens BIGINT,
    min_tokens_per_investor INTEGER,
    max_tokens_per_investor INTEGER,

    -- Documents & Investors
    pre_registered_investors JSONB DEFAULT '[]',
    uploaded_fund_documents JSONB DEFAULT '[]',
    uploaded_investor_documents JSONB DEFAULT '[]',

    -- Hierarchy
    hierarchy_mode BOOLEAN DEFAULT FALSE,
    hierarchy_setup_approach VARCHAR(50) CHECK (hierarchy_setup_approach IN ('all-at-once', 'incremental', NULL)),
    hierarchy_levels INTEGER,
    number_of_levels INTEGER,
    hierarchy_structures JSONB,
    parent_structure_id UUID REFERENCES structures(id) ON DELETE SET NULL,
    parent_structure_ownership_percentage DECIMAL(5, 2),
    child_structure_ids JSONB DEFAULT '[]',
    hierarchy_level INTEGER DEFAULT 1,
    hierarchy_path JSONB DEFAULT '[]',
    apply_waterfall_at_this_level BOOLEAN,
    apply_economic_terms_at_this_level BOOLEAN,
    waterfall_algorithm VARCHAR(50) CHECK (waterfall_algorithm IN ('american', 'european', 'hybrid', NULL)),
    income_flow_target VARCHAR(100),

    -- Performance Methodology
    performance_methodology VARCHAR(50) CHECK (performance_methodology IN ('granular', 'grossup', NULL)),
    calculation_level VARCHAR(50) CHECK (calculation_level IN ('fund-level', 'portfolio-level', NULL)),

    -- NAV Tracking
    current_nav DECIMAL(20, 2),
    nav_history JSONB DEFAULT '[]',

    -- Legal Terms
    legal_terms JSONB,

    -- Metadata
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT check_us_state CHECK (
        (jurisdiction != 'United States' AND jurisdiction != 'USA' AND jurisdiction != 'US') OR
        us_state IS NOT NULL
    )
);

-- Indexes
CREATE INDEX idx_structures_type ON structures(type);
CREATE INDEX idx_structures_status ON structures(status);
CREATE INDEX idx_structures_parent_structure_id ON structures(parent_structure_id);
CREATE INDEX idx_structures_hierarchy_level ON structures(hierarchy_level);
CREATE INDEX idx_structures_jurisdiction ON structures(jurisdiction);
CREATE INDEX idx_structures_created_date ON structures(created_date DESC);

-- ============================================================================
-- TABLE: investors
-- Description: Limited Partners (Individual, Institution, Family Office, Fund-of-Funds)
-- ============================================================================
CREATE TABLE investors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    type VARCHAR(50) NOT NULL CHECK (type IN ('individual', 'institution', 'family-office', 'fund-of-funds')),
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'KYC/KYB', 'Contracts', 'Commitment', 'Active', 'Inactive')),

    -- Entity Details (for non-individual investors)
    entity_name VARCHAR(255),
    entity_type VARCHAR(100),
    contact_first_name VARCHAR(100),
    contact_last_name VARCHAR(100),

    -- Fund Relationships (many-to-many via JSONB array)
    fund_ownerships JSONB NOT NULL DEFAULT '[]',

    -- Custom Terms (global - overridden by fund-specific)
    custom_terms JSONB,

    -- Portfolio Metrics
    current_value DECIMAL(20, 2) NOT NULL DEFAULT 0,
    unrealized_gain DECIMAL(20, 2) NOT NULL DEFAULT 0,
    total_distributed DECIMAL(20, 2) NOT NULL DEFAULT 0,
    net_cash_flow DECIMAL(20, 2) NOT NULL DEFAULT 0,
    irr DECIMAL(10, 4) NOT NULL DEFAULT 0,

    -- Tax & Compliance
    tax_id VARCHAR(50),
    k1_status VARCHAR(50) NOT NULL DEFAULT 'Not Generated',
    k1_delivery_date DATE,

    -- Contact Information
    address JSONB,
    preferred_contact_method VARCHAR(50) NOT NULL DEFAULT 'Email' CHECK (preferred_contact_method IN ('Email', 'Phone', 'Portal')),
    last_contact_date TIMESTAMP,

    -- Notes & Documents
    notes TEXT NOT NULL DEFAULT '',
    documents JSONB NOT NULL DEFAULT '[]',

    -- Metadata
    investor_since DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT check_entity_fields CHECK (
        (type = 'individual') OR
        (entity_name IS NOT NULL AND contact_first_name IS NOT NULL AND contact_last_name IS NOT NULL)
    )
);

-- Indexes
CREATE INDEX idx_investors_email ON investors(email);
CREATE INDEX idx_investors_type ON investors(type);
CREATE INDEX idx_investors_status ON investors(status);
CREATE INDEX idx_investors_investor_since ON investors(investor_since DESC);
CREATE INDEX idx_investors_created_at ON investors(created_at DESC);

-- GIN index for JSONB fund_ownerships
CREATE INDEX idx_investors_fund_ownerships ON investors USING GIN (fund_ownerships);

-- ============================================================================
-- TABLE: investments
-- Description: Portfolio investments (Real Estate, Private Equity, Private Debt)
-- ============================================================================
CREATE TABLE investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Real Estate', 'Private Equity', 'Private Debt')),
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Closed', 'Pending', 'Exited')),
    sector VARCHAR(100) NOT NULL,
    investment_type VARCHAR(50) NOT NULL CHECK (investment_type IN ('EQUITY', 'DEBT', 'MIXED')),

    -- Valuation (type-specific)
    total_property_value DECIMAL(20, 2),
    total_company_value DECIMAL(20, 2),
    total_project_value DECIMAL(20, 2),

    -- Geography
    geography JSONB NOT NULL, -- {city, state, country}
    address JSONB,

    -- Positions
    fund_equity_position JSONB, -- {ownershipPercent, equityInvested, currentEquityValue, unrealizedGain}
    fund_debt_position JSONB, -- {principalProvided, interestRate, originationDate, maturityDate, accruedInterest, currentDebtValue, unrealizedGain}
    external_debt JSONB NOT NULL DEFAULT '[]',
    total_fund_position JSONB NOT NULL, -- {totalInvested, currentValue, unrealizedGain, irr, multiple}

    -- Investment Metrics
    total_investment_size DECIMAL(20, 2),
    fund_commitment DECIMAL(20, 2),
    ownership_percentage DECIMAL(5, 2), -- Calculated from equity position ONLY

    -- Access Control
    visibility JSONB,

    -- Relationships
    fund_id UUID NOT NULL REFERENCES structures(id) ON DELETE CASCADE,

    -- Dates
    acquisition_date DATE NOT NULL,
    last_valuation_date DATE NOT NULL,
    exit_date DATE,

    -- Details
    description TEXT NOT NULL DEFAULT '',
    documents JSONB NOT NULL DEFAULT '[]',

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT check_equity_position CHECK (
        (investment_type = 'DEBT') OR
        (fund_equity_position IS NOT NULL)
    ),
    CONSTRAINT check_debt_position CHECK (
        (investment_type = 'EQUITY') OR
        (fund_debt_position IS NOT NULL)
    ),
    CONSTRAINT check_mixed_positions CHECK (
        (investment_type != 'MIXED') OR
        (fund_equity_position IS NOT NULL AND fund_debt_position IS NOT NULL)
    )
);

-- Indexes
CREATE INDEX idx_investments_fund_id ON investments(fund_id);
CREATE INDEX idx_investments_type ON investments(type);
CREATE INDEX idx_investments_status ON investments(status);
CREATE INDEX idx_investments_investment_type ON investments(investment_type);
CREATE INDEX idx_investments_acquisition_date ON investments(acquisition_date DESC);
CREATE INDEX idx_investments_created_at ON investments(created_at DESC);

-- ============================================================================
-- TABLE: capital_calls
-- Description: Capital call notices to investors
-- ============================================================================
CREATE TABLE capital_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fund_id UUID NOT NULL REFERENCES structures(id) ON DELETE CASCADE,
    fund_name VARCHAR(255) NOT NULL,
    call_number INTEGER NOT NULL,
    total_call_amount DECIMAL(20, 2) NOT NULL CHECK (total_call_amount > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    call_date DATE NOT NULL,
    due_date DATE NOT NULL,
    notice_period_days INTEGER NOT NULL,
    purpose TEXT NOT NULL,

    -- Related Investment
    related_investment_id UUID REFERENCES investments(id) ON DELETE SET NULL,
    related_investment_name VARCHAR(255),

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Partially Paid', 'Fully Paid', 'Overdue', 'Cancelled')),
    sent_date TIMESTAMP,

    -- Investor Allocations (embedded JSONB array)
    investor_allocations JSONB NOT NULL DEFAULT '[]',

    -- Payment Tracking
    total_paid_amount DECIMAL(20, 2) NOT NULL DEFAULT 0 CHECK (total_paid_amount >= 0),
    total_outstanding_amount DECIMAL(20, 2) NOT NULL DEFAULT 0 CHECK (total_outstanding_amount >= 0),

    -- ILPA Standards
    transaction_type VARCHAR(100) NOT NULL,
    use_of_proceeds TEXT NOT NULL,
    management_fee_included BOOLEAN NOT NULL DEFAULT FALSE,
    management_fee_amount DECIMAL(20, 2),

    -- Communication
    cover_letter_template TEXT,
    notice_document_url TEXT,

    -- Metadata
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    cancelled_date TIMESTAMP,
    cancelled_reason TEXT,

    -- Constraints
    CONSTRAINT check_due_date CHECK (due_date > call_date),
    CONSTRAINT check_call_number_unique UNIQUE (fund_id, call_number)
);

-- Indexes
CREATE INDEX idx_capital_calls_fund_id ON capital_calls(fund_id);
CREATE INDEX idx_capital_calls_status ON capital_calls(status);
CREATE INDEX idx_capital_calls_call_date ON capital_calls(call_date DESC);
CREATE INDEX idx_capital_calls_due_date ON capital_calls(due_date);
CREATE INDEX idx_capital_calls_created_by ON capital_calls(created_by);

-- GIN index for JSONB investor_allocations
CREATE INDEX idx_capital_calls_investor_allocations ON capital_calls USING GIN (investor_allocations);

-- ============================================================================
-- TABLE: distributions
-- Description: Distribution payments to investors
-- ============================================================================
CREATE TABLE distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fund_id UUID NOT NULL REFERENCES structures(id) ON DELETE CASCADE,
    fund_name VARCHAR(255) NOT NULL,
    distribution_number INTEGER NOT NULL,
    total_distribution_amount DECIMAL(20, 2) NOT NULL CHECK (total_distribution_amount > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    distribution_date DATE NOT NULL,
    record_date DATE NOT NULL,
    payment_date DATE NOT NULL,

    -- Source
    source VARCHAR(100) NOT NULL CHECK (source IN ('Operating Income', 'Exit Proceeds', 'Refinancing', 'Return of Capital', 'Other')),
    source_description TEXT NOT NULL,

    -- Related Investment
    related_investment_id UUID REFERENCES investments(id) ON DELETE SET NULL,
    related_investment_name VARCHAR(255),

    -- Distribution Classification
    is_return_of_capital BOOLEAN NOT NULL DEFAULT FALSE,
    is_income BOOLEAN NOT NULL DEFAULT FALSE,
    is_capital_gain BOOLEAN NOT NULL DEFAULT FALSE,
    return_of_capital_amount DECIMAL(20, 2),
    income_amount DECIMAL(20, 2),
    capital_gain_amount DECIMAL(20, 2),

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processing', 'Completed', 'Failed')),
    processed_date TIMESTAMP,

    -- Investor Allocations (embedded JSONB array)
    investor_allocations JSONB NOT NULL DEFAULT '[]',

    -- Waterfall
    waterfall_applied BOOLEAN NOT NULL DEFAULT FALSE,
    waterfall_breakdown JSONB,

    -- ILPA Standards
    transaction_type VARCHAR(100) NOT NULL,
    exit_proceeds_multiple DECIMAL(10, 4),

    -- Communication
    cover_letter_template TEXT,
    notice_document_url TEXT,

    -- Metadata
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT check_distribution_number_unique UNIQUE (fund_id, distribution_number)
);

-- Indexes
CREATE INDEX idx_distributions_fund_id ON distributions(fund_id);
CREATE INDEX idx_distributions_status ON distributions(status);
CREATE INDEX idx_distributions_distribution_date ON distributions(distribution_date DESC);
CREATE INDEX idx_distributions_created_by ON distributions(created_by);

-- GIN index for JSONB investor_allocations
CREATE INDEX idx_distributions_investor_allocations ON distributions USING GIN (investor_allocations);

-- ============================================================================
-- TABLE: investment_subscriptions
-- Description: Investor subscription requests for investments
-- ============================================================================
CREATE TABLE investment_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
    investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
    fund_id UUID NOT NULL REFERENCES structures(id) ON DELETE CASCADE,
    requested_amount DECIMAL(20, 2) NOT NULL CHECK (requested_amount > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
    approval_reason TEXT,
    admin_notes TEXT,
    linked_fund_ownership_created BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT check_unique_pending_subscription UNIQUE (investor_id, investment_id, status) WHERE status = 'pending'
);

-- Indexes
CREATE INDEX idx_subscriptions_investment_id ON investment_subscriptions(investment_id);
CREATE INDEX idx_subscriptions_investor_id ON investment_subscriptions(investor_id);
CREATE INDEX idx_subscriptions_fund_id ON investment_subscriptions(fund_id);
CREATE INDEX idx_subscriptions_status ON investment_subscriptions(status);
CREATE INDEX idx_subscriptions_created_at ON investment_subscriptions(created_at DESC);

-- ============================================================================
-- TABLE: waterfall_tiers
-- Description: Distribution waterfall tier configurations
-- ============================================================================
CREATE TABLE waterfall_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    structure_id UUID NOT NULL REFERENCES structures(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL CHECK (type IN ('RETURN_OF_CAPITAL', 'PREFERRED_RETURN', 'CATCH_UP', 'CARRIED_INTEREST')),
    tier_order INTEGER NOT NULL,
    hurdle_rate DECIMAL(5, 2), -- Percentage
    lp_split DECIMAL(5, 2), -- Percentage
    gp_split DECIMAL(5, 2), -- Percentage
    catch_up_to DECIMAL(5, 2), -- Target GP percentage
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT check_split_sum CHECK (
        (lp_split IS NULL AND gp_split IS NULL) OR
        (lp_split + gp_split = 100)
    ),
    CONSTRAINT check_unique_tier_order UNIQUE (structure_id, tier_order, is_active) WHERE is_active = TRUE
);

-- Indexes
CREATE INDEX idx_waterfall_tiers_structure_id ON waterfall_tiers(structure_id);
CREATE INDEX idx_waterfall_tiers_type ON waterfall_tiers(type);
CREATE INDEX idx_waterfall_tiers_is_active ON waterfall_tiers(is_active);
CREATE INDEX idx_waterfall_tiers_tier_order ON waterfall_tiers(structure_id, tier_order);

-- ============================================================================
-- TABLE: documents
-- Description: Document management with versioning
-- ============================================================================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('Structure', 'Investor', 'Investment', 'CapitalCall', 'Distribution', 'User')),
    entity_id UUID NOT NULL,
    url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    version INTEGER NOT NULL DEFAULT 1,
    previous_version_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    version_notes TEXT,
    tags JSONB DEFAULT '[]',
    metadata JSONB,

    -- Metadata
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    uploaded_date TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_documents_version ON documents(previous_version_id);

-- GIN index for tags
CREATE INDEX idx_documents_tags ON documents USING GIN (tags);

-- ============================================================================
-- TABLE: payments
-- Description: Payment transactions (bank transfer, crypto, etc.)
-- ============================================================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES api_users(id) ON DELETE SET NULL,
    structure_id UUID REFERENCES structures(id) ON DELETE SET NULL,
    submission_id UUID, -- DocuSeal submission ID
    email VARCHAR(255) NOT NULL,
    amount DECIMAL(20, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('bank-transfer', 'credit-card', 'usdc', 'wire', 'ach', 'other')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    file_url TEXT,
    file_name VARCHAR(255),
    transaction_reference VARCHAR(255),
    notes TEXT,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_structure_id ON payments(structure_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX idx_payments_email ON payments(email);

-- ============================================================================
-- TABLE: firm_settings
-- Description: Firm-level configuration settings
-- ============================================================================
CREATE TABLE firm_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_name VARCHAR(255) NOT NULL,
    firm_logo TEXT,
    firm_description TEXT,
    firm_website VARCHAR(255),
    firm_address TEXT,
    firm_phone VARCHAR(50),
    firm_email VARCHAR(255),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: notification_settings
-- Description: User notification preferences
-- ============================================================================
CREATE TABLE notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,

    -- Event Settings (JSONB: {id, name, description, category, enabled, frequency})
    capital_call_issued JSONB NOT NULL DEFAULT '{"enabled": true, "frequency": "real-time"}',
    distribution_executed JSONB NOT NULL DEFAULT '{"enabled": true, "frequency": "real-time"}',
    payment_overdue JSONB NOT NULL DEFAULT '{"enabled": true, "frequency": "daily-digest"}',
    payment_received JSONB NOT NULL DEFAULT '{"enabled": true, "frequency": "real-time"}',
    report_generated JSONB NOT NULL DEFAULT '{"enabled": true, "frequency": "real-time"}',
    quarterly_report_due JSONB NOT NULL DEFAULT '{"enabled": true, "frequency": "weekly-summary"}',
    new_investor_added JSONB NOT NULL DEFAULT '{"enabled": true, "frequency": "daily-digest"}',
    investor_document_uploaded JSONB NOT NULL DEFAULT '{"enabled": true, "frequency": "daily-digest"}',
    system_maintenance JSONB NOT NULL DEFAULT '{"enabled": true, "frequency": "real-time"}',
    security_alert JSONB NOT NULL DEFAULT '{"enabled": true, "frequency": "real-time"}',

    -- Contact Settings
    email_address VARCHAR(255),
    enable_email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    enable_in_app_notifications BOOLEAN NOT NULL DEFAULT TRUE,

    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notification_settings_user_id ON notification_settings(user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_users_updated_at BEFORE UPDATE ON api_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kyc_sessions_updated_at BEFORE UPDATE ON kyc_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_structures_updated_at BEFORE UPDATE ON structures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investors_updated_at BEFORE UPDATE ON investors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_capital_calls_updated_at BEFORE UPDATE ON capital_calls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_distributions_updated_at BEFORE UPDATE ON distributions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investment_subscriptions_updated_at BEFORE UPDATE ON investment_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_waterfall_tiers_updated_at BEFORE UPDATE ON waterfall_tiers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_firm_settings_updated_at BEFORE UPDATE ON firm_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON notification_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Active Structures with Investor Count
CREATE VIEW v_active_structures AS
SELECT
    s.*,
    COUNT(DISTINCT jsonb_array_elements(i.fund_ownerships)->>'fundId') as investor_count
FROM structures s
LEFT JOIN investors i ON (i.fund_ownerships @> jsonb_build_array(jsonb_build_object('fundId', s.id::text)))
WHERE s.status = 'active'
GROUP BY s.id;

-- View: Investor Portfolio Summary
CREATE VIEW v_investor_portfolio AS
SELECT
    i.id as investor_id,
    i.name as investor_name,
    i.email,
    i.type as investor_type,
    COUNT(DISTINCT jsonb_array_elements(i.fund_ownerships)->>'fundId') as fund_count,
    i.current_value,
    i.unrealized_gain,
    i.total_distributed,
    i.net_cash_flow,
    i.irr
FROM investors i
WHERE i.status = 'Active'
GROUP BY i.id;

-- View: Structure Performance Summary
CREATE VIEW v_structure_performance AS
SELECT
    s.id as structure_id,
    s.name as structure_name,
    s.type,
    s.total_commitment,
    COUNT(DISTINCT inv.id) as investment_count,
    SUM(inv.fund_commitment) as total_invested,
    SUM((inv.total_fund_position->>'currentValue')::decimal) as current_portfolio_value,
    SUM((inv.total_fund_position->>'unrealizedGain')::decimal) as total_unrealized_gain,
    AVG((inv.total_fund_position->>'irr')::decimal) as avg_irr,
    AVG((inv.total_fund_position->>'multiple')::decimal) as avg_multiple
FROM structures s
LEFT JOIN investments inv ON inv.fund_id = s.id AND inv.status = 'Active'
GROUP BY s.id, s.name, s.type, s.total_commitment;

-- View: Capital Call Summary
CREATE VIEW v_capital_call_summary AS
SELECT
    cc.id,
    cc.fund_id,
    cc.fund_name,
    cc.call_number,
    cc.total_call_amount,
    cc.total_paid_amount,
    cc.total_outstanding_amount,
    cc.status,
    cc.call_date,
    cc.due_date,
    CASE
        WHEN cc.status = 'Fully Paid' THEN 100
        ELSE (cc.total_paid_amount / cc.total_call_amount * 100)
    END as payment_percentage,
    jsonb_array_length(cc.investor_allocations) as investor_count
FROM capital_calls cc;

-- View: Distribution Summary
CREATE VIEW v_distribution_summary AS
SELECT
    d.id,
    d.fund_id,
    d.fund_name,
    d.distribution_number,
    d.total_distribution_amount,
    d.status,
    d.distribution_date,
    d.source,
    d.waterfall_applied,
    jsonb_array_length(d.investor_allocations) as investor_count
FROM distributions d;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Get Structure Investor Count
CREATE OR REPLACE FUNCTION get_structure_investor_count(structure_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    investor_count INTEGER;
BEGIN
    SELECT COUNT(DISTINCT i.id)
    INTO investor_count
    FROM investors i,
         jsonb_array_elements(i.fund_ownerships) AS fo
    WHERE (fo->>'fundId')::uuid = structure_uuid;

    RETURN COALESCE(investor_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function: Get Structure Investment Count
CREATE OR REPLACE FUNCTION get_structure_investment_count(structure_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    investment_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO investment_count
    FROM investments
    WHERE fund_id = structure_uuid;

    RETURN COALESCE(investment_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate Structure Issuance Count
CREATE OR REPLACE FUNCTION get_structure_issuance_count(structure_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    issuance_count INTEGER;
BEGIN
    SELECT SUM(
        CASE
            WHEN investment_type = 'MIXED' THEN 2
            WHEN investment_type IN ('EQUITY', 'DEBT') THEN 1
            ELSE 0
        END
    )
    INTO issuance_count
    FROM investments
    WHERE fund_id = structure_uuid;

    RETURN COALESCE(issuance_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-increment Capital Call Number
CREATE OR REPLACE FUNCTION set_capital_call_number()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
BEGIN
    SELECT COALESCE(MAX(call_number), 0) + 1
    INTO next_number
    FROM capital_calls
    WHERE fund_id = NEW.fund_id;

    NEW.call_number = next_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_capital_call_number
    BEFORE INSERT ON capital_calls
    FOR EACH ROW
    WHEN (NEW.call_number IS NULL)
    EXECUTE FUNCTION set_capital_call_number();

-- Function: Auto-increment Distribution Number
CREATE OR REPLACE FUNCTION set_distribution_number()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
BEGIN
    SELECT COALESCE(MAX(distribution_number), 0) + 1
    INTO next_number
    FROM distributions
    WHERE fund_id = NEW.fund_id;

    NEW.distribution_number = next_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_distribution_number
    BEFORE INSERT ON distributions
    FOR EACH ROW
    WHEN (NEW.distribution_number IS NULL)
    EXECUTE FUNCTION set_distribution_number();

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert sample admin user
INSERT INTO users (name, email, role, status) VALUES
('Admin User', 'admin@polibit.io', 'admin', 'active');

-- Insert sample firm settings
INSERT INTO firm_settings (firm_name, firm_email) VALUES
('Polibit Investment Management', 'info@polibit.io');

-- ============================================================================
-- GRANTS (Adjust based on your user roles)
-- ============================================================================

-- Example: Grant permissions to app user
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO polibit_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO polibit_app;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO polibit_app;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

-- Notes:
-- 1. All monetary values use DECIMAL(20, 2) for precision
-- 2. JSONB is used for flexible nested data (fund_ownerships, allocations, etc.)
-- 3. UUIDs are used for primary keys for distributed system compatibility
-- 4. Indexes are created on foreign keys and frequently queried columns
-- 5. GIN indexes are created on JSONB columns for efficient querying
-- 6. Triggers auto-update the updated_at timestamp
-- 7. Views provide commonly used aggregations
-- 8. Functions provide reusable business logic
-- 9. Constraints ensure data integrity
-- 10. Comments on each table explain purpose and usage
