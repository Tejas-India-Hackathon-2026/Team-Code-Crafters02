import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { BidManagePayload, BidManageResponse } from '../../../../../types/bids';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request): Promise<NextResponse<BidManageResponse>> {
    try {
        const body: BidManagePayload = await request.json();
        const { action, projectId, vendorId, bidId, bidAmount, proposalText } = body;

        if (!action || !projectId) {
            return NextResponse.json(
                {
                    success: false,
                    action: action || 'SUBMIT',
                    message: 'Missing required parameters: action and projectId are mandatory.',
                },
                { status: 400 }
            );
        }

        // 1. DELETE / WITHDRAW BID
        if (action === 'DELETE') {
            let deleteQuery = supabaseAdmin.from('project_bids').delete();
            if (bidId) {
                deleteQuery = deleteQuery.eq('id', bidId);
            } else if (vendorId) {
                deleteQuery = deleteQuery.eq('project_id', projectId).eq('vendor_id', vendorId);
            } else {
                return NextResponse.json(
                    {
                        success: false,
                        action: 'DELETE',
                        message: 'Either bidId or vendorId is required to withdraw a bid.',
                    },
                    { status: 400 }
                );
            }

            const { error: delErr } = await deleteQuery;
            if (delErr) {
                console.error('Error deleting bid from Supabase:', delErr);
            }

            return NextResponse.json({
                success: true,
                action: 'DELETE',
                bid: null,
                message: 'Bid successfully withdrawn from the commission project.',
            });
        }

        // 2. UPDATE EXISTING BID
        if (action === 'UPDATE') {
            if (!bidAmount && bidAmount !== 0) {
                return NextResponse.json(
                    {
                        success: false,
                        action: 'UPDATE',
                        message: 'bidAmount is required for updating proposal.',
                    },
                    { status: 400 }
                );
            }

            let updateQuery = supabaseAdmin
                .from('project_bids')
                .update({
                    bid_amount: Number(bidAmount),
                    proposal_text: proposalText || '',
                    updated_at: new Date().toISOString(),
                });

            if (bidId) {
                updateQuery = updateQuery.eq('id', bidId);
            } else if (vendorId) {
                updateQuery = updateQuery.eq('project_id', projectId).eq('vendor_id', vendorId);
            } else {
                return NextResponse.json(
                    {
                        success: false,
                        action: 'UPDATE',
                        message: 'bidId or vendorId is required to update a bid.',
                    },
                    { status: 400 }
                );
            }

            const { data: updatedBid, error: updateErr } = await updateQuery.select('*').maybeSingle();
            if (updateErr) {
                console.error('Error updating bid in Supabase:', updateErr);
            }

            return NextResponse.json({
                success: true,
                action: 'UPDATE',
                bid: updatedBid || null,
                message: 'Proposal successfully updated with revised terms.',
            });
        }

        // 3. SUBMIT NEW BID
        if (action === 'SUBMIT') {
            if (!vendorId || (!bidAmount && bidAmount !== 0)) {
                return NextResponse.json(
                    {
                        success: false,
                        action: 'SUBMIT',
                        message: 'vendorId and bidAmount are required to submit a proposal.',
                    },
                    { status: 400 }
                );
            }

            // Check if existing bid exists to prevent duplicates
            const { data: existing } = await supabaseAdmin
                .from('project_bids')
                .select('*')
                .eq('project_id', projectId)
                .eq('vendor_id', vendorId)
                .maybeSingle();

            if (existing) {
                const { data: updated, error: uErr } = await supabaseAdmin
                    .from('project_bids')
                    .update({
                        bid_amount: Number(bidAmount),
                        proposal_text: proposalText || '',
                        status: 'PENDING',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', existing.id)
                    .select('*')
                    .single();

                if (uErr) throw uErr;

                return NextResponse.json({
                    success: true,
                    action: 'UPDATE',
                    bid: updated,
                    message: 'Existing proposal updated successfully with new terms.',
                });
            }

            const { data: inserted, error: insertErr } = await supabaseAdmin
                .from('project_bids')
                .insert({
                    project_id: projectId,
                    vendor_id: vendorId,
                    bid_amount: Number(bidAmount),
                    proposal_text: proposalText || '',
                    status: 'PENDING',
                })
                .select('*')
                .single();

            if (insertErr) {
                console.error('Error inserting bid:', insertErr);
            }

            return NextResponse.json({
                success: true,
                action: 'SUBMIT',
                bid: inserted || null,
                message: 'Bid proposal submitted successfully to the buyer.',
            });
        }

        return NextResponse.json(
            {
                success: false,
                action,
                message: `Unsupported action "${action}".`,
            },
            { status: 400 }
        );
    } catch (err: any) {
        console.error('Bid manage API route exception:', err);
        return NextResponse.json(
            {
                success: false,
                action: 'SUBMIT',
                message: err.message || 'Internal server error processing bid.',
                error: err.toString(),
            },
            { status: 500 }
        );
    }
}
