import { NextResponse } from 'next/server';
import { createServerSideClient } from '../../../../../lib/supabaseServer';

export async function POST(request: Request) {
    try {
        const supabase = await createServerSideClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { projectId, vendorId, grossAmount } = await request.json();

        // 1. Calculate Statutory Tax Deductions
        // Section 194-O TDS: 1% of gross amount
        const withheldTds = Number((grossAmount * 0.01).toFixed(2));

        // Platform GST split simulation (18% on convenience fee)
        const platformFee = Number((grossAmount * 0.05).toFixed(2));
        const gstSplit = {
            cgst: Number((platformFee * 0.09).toFixed(2)),
            sgst: Number((platformFee * 0.09).toFixed(2)),
            igst: 0,
        };

        const netPayout = Number((grossAmount - withheldTds).toFixed(2));

        // 2. Mock / Real Castler Nodal API integration
        const mockCastlerOrderId = `CAS-${Date.now()}`;
        const nodalPaymentUrl = `https://gateway.castler.com/pay/${mockCastlerOrderId}`;

        // 3. Persist Order in Supabase
        const { data: order, error: dbError } = await supabase
            .from('escrow_orders')
            .insert({
                project_id: projectId,
                buyer_id: user.id,
                vendor_id: vendorId,
                rail: 'WEB2_NODAL',
                gross_amount: grossAmount,
                withheld_tds: withheldTds,
                gst_split: gstSplit,
                net_payout: netPayout,
                status: 'AWAITING_PAYMENT',
                nodal_ref_id: mockCastlerOrderId,
            })
            .select('id, nodal_ref_id')
            .single();

        if (dbError) throw dbError;

        return NextResponse.json({
            orderId: order.id,
            nodalPaymentUrl,
            withheldTds,
            netPayout,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}