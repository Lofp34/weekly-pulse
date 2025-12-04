'use server';

import { db } from '@/db/drizzle';
import { audits, salesReps } from '@/db/schema';
import { desc, and, eq } from 'drizzle-orm';

export interface AuditData {
    managerEmail: string;
    salesRepName: string;
    salesRepId?: string;
    prospectingActions: number;
    discoveryMeetings: number;
    proposalsSent: number;
    signedProposals: number;
    revenue: number;
    flashTestObjection: string;
    flashTestPassed: boolean;
    recognitionNote: string;
    totalScore: number;
}

export async function submitAudit(data: AuditData) {
    try {
        const result = await db.insert(audits).values(data).returning();
        return { success: true, data: result[0] };
    } catch (error) {
        console.error('Error submitting audit:', error);
        return { success: false, error: 'Failed to submit audit' };
    }
}

export async function getHistory(managerEmail: string, salesRepName: string) {
    try {
        const history = await db
            .select({
                id: audits.id,
                totalScore: audits.totalScore,
                createdAt: audits.createdAt,
            })
            .from(audits)
            .where(
                and(
                    eq(audits.managerEmail, managerEmail),
                    eq(audits.salesRepName, salesRepName)
                )
            )
            .orderBy(desc(audits.createdAt))
            .limit(5);

        return { success: true, data: history };
    } catch (error) {
        console.error('Error fetching history:', error);
        return { success: false, error: 'Failed to fetch history', data: [] };
    }
}

// Sales Rep Management Actions

export async function getSalesReps() {
    try {
        const reps = await db.select().from(salesReps).orderBy(salesReps.name);
        return { success: true, data: reps };
    } catch (error) {
        console.error('Error fetching sales reps:', error);
        return { success: false, error: 'Failed to fetch sales reps', data: [] };
    }
}

export async function createSalesRep(name: string, email?: string) {
    try {
        const result = await db.insert(salesReps).values({ name, email }).returning();
        return { success: true, data: result[0] };
    } catch (error) {
        console.error('Error creating sales rep:', error);
        return { success: false, error: 'Failed to create sales rep' };
    }
}

export async function deleteSalesRep(id: string) {
    try {
        await db.delete(salesReps).where(eq(salesReps.id, id));
        return { success: true };
    } catch (error) {
        console.error('Error deleting sales rep:', error);
        return { success: false, error: 'Failed to delete sales rep' };
    }
}

export async function seedDefaultReps() {
    try {
        const existing = await db.select().from(salesReps).limit(1);
        if (existing.length > 0) {
            return { success: true, message: 'Default reps already exist' };
        }

        await db.insert(salesReps).values([
            { name: 'Thomas', email: 'thomas@example.com' },
            { name: 'Julie', email: 'julie@example.com' },
        ]);

        return { success: true, message: 'Default reps created' };
    } catch (error) {
        console.error('Error seeding default reps:', error);
        return { success: false, error: 'Failed to seed default reps' };
    }
}

// Dashboard Actions

export async function getAllAuditsWithReps() {
    try {
        const allAudits = await db
            .select({
                id: audits.id,
                salesRepName: audits.salesRepName,
                totalScore: audits.totalScore,
                createdAt: audits.createdAt,
                managerEmail: audits.managerEmail,
            })
            .from(audits)
            .orderBy(desc(audits.createdAt))
            .limit(50);

        return { success: true, data: allAudits };
    } catch (error) {
        console.error('Error fetching all audits:', error);
        return { success: false, error: 'Failed to fetch audits', data: [] };
    }
}
