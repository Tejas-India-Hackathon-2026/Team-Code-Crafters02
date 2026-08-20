export type BidManagementAction = 'SUBMIT' | 'UPDATE' | 'DELETE';

export interface ArtisanBidRecord {
    id: string;
    project_id: string;
    vendor_id: string;
    bid_amount: number;
    proposal_text: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
    created_at?: string;
    updated_at?: string;
    vendor?: {
        full_name?: string;
        vendor_verified?: boolean;
        avatar_url?: string;
    };
}

export interface BidManagePayload {
    action: BidManagementAction;
    projectId: string;
    vendorId?: string;
    bidId?: string;
    bidAmount?: number;
    proposalText?: string;
    vendorName?: string;
}

export interface BidManageResponse {
    success: boolean;
    action: BidManagementAction;
    bid?: ArtisanBidRecord | null;
    message: string;
    error?: string;
}
