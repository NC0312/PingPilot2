// app/api/subscription/route.js
import { NextResponse } from 'next/server';
import { createSubscription, PLAN_TYPES } from '@/app/utils/subscriptionPlans';
import { db } from '@/app/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

// API endpoint to update user subscription
export async function POST(req) {
    try {
        const { userId, planType, paymentId } = await req.json();

        // Validate input
        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required', type: 'missing_id' },
                { status: 400 }
            );
        }

        if (!planType || !Object.values(PLAN_TYPES).includes(planType)) {
            return NextResponse.json(
                { error: 'Valid plan type is required', type: 'invalid_plan' },
                { status: 400 }
            );
        }

        // Check if user exists
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return NextResponse.json(
                { error: 'User not found', type: 'not_found' },
                { status: 404 }
            );
        }

        // Create new subscription
        const subscription = createSubscription(planType);

        // Add payment ID if provided
        if (paymentId) {
            subscription.paymentId = paymentId;
        }

        // Update user with new subscription
        await updateDoc(userRef, {
            subscription,
            updatedAt: Date.now()
        });

        return NextResponse.json({
            message: 'Subscription updated successfully',
            subscription
        });
    } catch (error) {
        console.error('Error updating subscription:', error);
        return NextResponse.json(
            { error: 'Failed to update subscription', type: 'server_error', details: error.message },
            { status: 500 }
        );
    }
}

// API endpoint to retrieve subscription details
export async function GET(req) {
    try {
        // Get user ID from query parameter
        const url = new URL(req.url);
        const userId = url.searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required', type: 'missing_id' },
                { status: 400 }
            );
        }

        // Check if user exists
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return NextResponse.json(
                { error: 'User not found', type: 'not_found' },
                { status: 404 }
            );
        }

        const userData = userSnap.data();

        // Return subscription details
        return NextResponse.json({
            subscription: userData.subscription || null,
            role: userData.role
        });
    } catch (error) {
        console.error('Error getting subscription:', error);
        return NextResponse.json(
            { error: 'Failed to get subscription', type: 'server_error', details: error.message },
            { status: 500 }
        );
    }
}