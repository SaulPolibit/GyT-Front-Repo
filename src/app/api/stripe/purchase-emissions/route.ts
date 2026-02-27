import { NextRequest, NextResponse } from 'next/server';
import { stripe, getSharedPriceIds, EMISSION_PACKS } from '@/lib/stripe-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, subscriptionId, emissionPackId } = body;

    if (!customerId || !subscriptionId || !emissionPackId) {
      return NextResponse.json(
        { success: false, error: 'customerId, subscriptionId, and emissionPackId required' },
        { status: 400 }
      );
    }

    const sharedPriceIds = getSharedPriceIds();

    // Map pack ID to price ID
    const priceIdMap: Record<string, string> = {
      emissionSingle: sharedPriceIds.emissionSingle,
      emissionPack5: sharedPriceIds.emissionPack5,
      emissionPack10: sharedPriceIds.emissionPack10,
      emissionPack20: sharedPriceIds.emissionPack20,
    };

    const priceId = priceIdMap[emissionPackId];
    if (!priceId) {
      return NextResponse.json(
        { success: false, error: `Invalid emission pack: ${emissionPackId}` },
        { status: 400 }
      );
    }

    // Get emission count for this pack
    const packSizeMap: Record<string, number> = {
      emissionSingle: EMISSION_PACKS.single,
      emissionPack5: EMISSION_PACKS.pack5,
      emissionPack10: EMISSION_PACKS.pack10,
      emissionPack20: EMISSION_PACKS.pack20,
    };
    const emissionsToAdd = packSizeMap[emissionPackId] || 1;

    // Create invoice item for one-time purchase
    const invoiceItem = await stripe.invoiceItems.create({
      customer: customerId,
      price: priceId,
      description: `Additional Emissions (${emissionsToAdd})`,
    });

    // Create and pay invoice immediately
    const invoice = await stripe.invoices.create({
      customer: customerId,
      auto_advance: true,
      collection_method: 'charge_automatically',
      metadata: {
        type: 'emission_purchase',
        emissionPackId,
        emissionsAdded: emissionsToAdd.toString(),
      },
    });

    // Finalize and pay the invoice
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
    const paidInvoice = await stripe.invoices.pay(invoice.id);

    // Update subscription metadata with new emission count
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const currentEmissions = parseInt(subscription.metadata.emissionsAvailable || '0');
    const newEmissions = currentEmissions + emissionsToAdd;

    await stripe.subscriptions.update(subscriptionId, {
      metadata: {
        ...subscription.metadata,
        emissionsAvailable: newEmissions.toString(),
      },
    });

    return NextResponse.json({
      success: true,
      invoice: {
        id: paidInvoice.id,
        status: paidInvoice.status,
        amountPaid: paidInvoice.amount_paid,
      },
      emissionsAdded: emissionsToAdd,
      totalEmissions: newEmissions,
    });
  } catch (error: any) {
    console.error('[Stripe Purchase Emissions] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
