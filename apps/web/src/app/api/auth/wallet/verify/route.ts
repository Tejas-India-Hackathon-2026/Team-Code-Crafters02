import { NextResponse } from 'next/server';
import { createServerSideClient } from '../../../../../lib/supabaseServer';
import { verifyMessage } from 'viem';

export async function POST(request: Request) {
    try {
        const { address, signature, message } = await request.json();
        const supabase = await createServerSideClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isValid = await verifyMessage({
            address: address as `0x${string}`,
            message,
            signature: signature as `0x${string}`,
        });

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid signature challenge' }, { status: 400 });
        }

        // Save bound wallet address under profile
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ wallet_address: address.toLowerCase() })
            .eq('id', user.id);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, wallet_address: address });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}