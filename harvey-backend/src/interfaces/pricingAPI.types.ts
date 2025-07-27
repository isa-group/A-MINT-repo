/**
 * TypeScript interfaces based on the Pricing Analysis API OpenAPI specification
 */

// Base types
export type JobOperationType = 'validate' | 'optimal' | 'subscriptions' | 'filter';
export type JobSolverType = "minizinc";
export type JobStatusEnum = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

// Pricing Input Structures
export interface Plan {
    name: string;
    features: string[];
    price?: number;
    currency?: string;
    billingPeriod?: string;
    [key: string]: any;
}

export interface AddOn {
    name: string;
    availableFor: string[];
    price?: number;
    currency?: string;
    [key: string]: any;
}

export interface Feature {
    name: string;
    type?: string;
    description?: string;
    [key: string]: any;
}

export interface UsageLimit {
    name: string;
    type?: 'RENEWABLE' | 'NON_RENEWABLE';
    limit?: number;
    unit?: string;
    [key: string]: any;
}

export interface PricingInputYaml {
    saasName: string;
    syntaxVersion: string;
    version: string;
    createdAt: Date | string;
    currency: string;
    plans: { [key: string]: Plan };
    addOns?: { [key: string]: AddOn };
    features?: { [key: string]: Feature };
    usageLimits?: { [key: string]: UsageLimit };
    variables?: { [key: string]: any };
    [key: string]: any;
}

// Request types
export interface PricingSummaryRequest {
    pricingFile: File; // In form-data
}

export interface AnalysisJobRequest {
    pricingFile: File; // In form-data
    operation: JobOperationType;
    solver: JobSolverType;
    filters?: string; // JSON string for FilterCriteria
    objective?: 'minimize' | 'maximize';
    jobSpecificPayload?: string; // JSON string for operation-specific data
}

// Response types
export interface HealthResponse {
    status: string;
}

export interface PricingSummaryResponse {
    numberOfFeatures: number;
    numberOfPlans: number;
    numberOfFreePlans: number;
    numberOfPaidPlans: number;
    numberOfAddOns: number;
    numberOfInformationFeatures: number;
    numberOfIntegrationFeatures: number;
    numberOfIntegrationApiFeatures: number;
    numberOfIntegrationExtensionFeatures: number;
    numberOfIntegrationIdentityProviderFeatures: number;
    numberOfIntegrationWebSaaSFeatures: number;
    numberOfIntegrationMarketplaceFeatures: number;
    numberOfIntegrationExternalDeviceFeatures: number;
    numberOfDomainFeatures: number;
    numberOfAutomationFeatures: number;
    numberOfBotAutomationFeatures: number;
    numberOfFilteringAutomationFeatures: number;
    numberOfTrackingAutomationFeatures: number;
    numberOfTaskAutomationFeatures: number;
    numberOfManagementFeatures: number;
    numberOfGuaranteeFeatures: number;
    numberOfSupportFeatures: number;
    numberOfPaymentFeatures: number;
    numberOfUsageLimits: number;
    numberOfRenewableUsageLimits: number;
    numberOfNonRenewableUsageLimits: number;
    numberOfReplacementAddons: number;
    numberOfExtensionAddons: number;
    minPlanPrice: number;
    maxPlanPrice: number;
    maxSubscriptionPrice: number;
}

export interface JobCreationResponse {
    jobId: string;
    status: JobStatusEnum;
    submittedAt: string;
}

// Job result types
export interface ResultCardinality {
    cardinal: number;
}

export interface ResultValidate {
    valid: boolean;
    message?: string;
}

export interface ResultOptimumSubscriptionItem {
    plan: string;
    addOns?: string[];
    features?: string[];
    usageLimits?: any[];
}

export interface ResultOptimum {
    subscriptions: ResultOptimumSubscriptionItem[];
    cost: number;
}

export type JobResultData = ResultCardinality | ResultValidate | ResultOptimum | any;

// Job status responses
export interface JobPendingResponse {
    jobId: string;
    status: 'PENDING';
    message?: string;
    submittedAt: string;
}

export interface JobRunningResponse {
    jobId: string;
    status: 'RUNNING';
    message?: string;
    submittedAt: string;
    startedAt?: string;
}

export interface JobCompletedResponse {
    jobId: string;
    status: 'COMPLETED';
    submittedAt: string;
    startedAt?: string;
    completedAt: string;
    result: JobResultData;
}

export interface JobFailedResponse {
    jobId: string;
    status: 'FAILED';
    submittedAt: string;
    startedAt?: string;
    failedAt: string;
    error: string;
}

export type GetJobDetailsResponse = JobPendingResponse | JobRunningResponse | JobCompletedResponse | JobFailedResponse;

// Filter Criteria (for analysis operations)
export interface FilterCriteria {
    minPrice?: number;
    maxPrice?: number;
    features?: string[];
    usageLimits?: Record<string, number>[];
}
