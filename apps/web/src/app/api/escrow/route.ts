import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/escrow
 * Fetches statutory escrow orders associated with a user.
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 });
        }

        const { data: orders, error } = await supabaseAdmin
            .from('escrow_orders')
            .select(`
                id,
                buyer_id,
                vendor_id,
                project_id,
                gross_amount,
                tds_amount,
                net_vendor_amount,
                status,
                payment_rail,
                inspection_deadline,
                created_at,
                project:custom_projects(title),
                buyer:profiles!escrow_orders_buyer_id_fkey(full_name),
                vendor:profiles!escrow_orders_vendor_id_fkey(full_name)
            `)
            .or(`buyer_id.eq.${userId},vendor_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching escrow orders:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            count: orders?.length || 0,
            orders: orders || [],
        });
    } catch (err: any) {
        console.error('Escrow GET route error:', err);
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/escrow
 * Initializes statutory dual-rail escrow with automated 1% Section 194-O TDS compliance.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { buyerId, vendorId, projectId, grossAmount, paymentRail = 'FIAT_UPI' } = body;

        if (!buyerId || !vendorId || !grossAmount || grossAmount <= 0) {
            return NextResponse.json(
                { error: 'buyerId, vendorId, and valid grossAmount are required' },
                { status: 400 }
            );
        }

        const gross = Number(grossAmount);
        const tds = Math.round(gross * 0.01);
        const netVendor = gross - tds;

        const { data: order, error } = await supabaseAdmin
            .from('escrow_orders')
            .insert({
                buyer_id: buyerId,
                vendor_id: vendorId,
                project_id: projectId || null,
                gross_amount: gross,
                tds_amount: tds,
                net_vendor_amount: netVendor,
                status: 'INITIATED',
                payment_rail: paymentRail,
            })
            .select('*')
            .single();

        if (error) {
            console.error('Error creating escrow order:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            order,
            message: 'Statutory escrow initiated with 1% Section 194-O TDS automated compliance.',
        });
    } catch (err: any) {
        console.error('Escrow POST route error:', err);
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}
