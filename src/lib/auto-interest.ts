import { Member } from '@/types';
import { calculateAccumulatedInterest } from './loan-utils';
import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Automatically calculate and update pending interest for a member
 * This runs whenever member data is accessed to ensure interest is always current
 */
export async function autoCalculateInterest(member: Member): Promise<Member> {
  // Only calculate if member has an active loan
  if (!member.loanBalance || member.loanBalance <= 0) {
    return member;
  }

  // Calculate pending interest
  const calculation = calculateAccumulatedInterest(member);

  // If there's pending interest to charge, update the member
  if (calculation.monthsToCalculate > 0 && calculation.totalInterest > 0) {
    const updatedMember = {
      ...member,
      interestBalance: calculation.newInterestBalance,
      lastInterestCalculationDate: new Date(),
    };

    // Update in database
    await updateMemberInterest(member.id, calculation);

    return updatedMember;
  }

  return member;
}

/**
 * Automatically calculate interest for all members with active loans
 */
export async function autoCalculateInterestForAll(members: Member[]): Promise<Member[]> {
  const updatedMembers: Member[] = [];

  for (const member of members) {
    const updated = await autoCalculateInterest(member);
    updatedMembers.push(updated);
  }

  return updatedMembers;
}

/**
 * Update member interest in database and create transaction
 */
async function updateMemberInterest(
  memberId: string,
  calculation: { monthsToCalculate: number; totalInterest: number; newInterestBalance: number }
): Promise<void> {
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      // Update member
      await supabase
        .from('members')
        .update({
          interest_balance: calculation.newInterestBalance,
          last_interest_calculation_date: new Date().toISOString(),
        })
        .eq('id', memberId);

      // Create transaction
      await supabase
        .from('transactions')
        .insert({
          member_id: memberId,
          type: 'interest_charge',
          amount: calculation.totalInterest,
          description: `Auto-calculated interest - ${calculation.monthsToCalculate} month(s)`,
          date: new Date().toISOString(),
          balance_after: calculation.newInterestBalance,
          reference_number: `AUTO-INT-${Date.now()}-${memberId}`,
          processed_by: 'system',
        });
    } catch (error) {
      console.error('Error updating interest in Supabase:', error);
      // Fall through to localStorage
    }
  }

  // Update localStorage (will be handled by the db methods we call)
  // The db.updateMember and db.createTransaction methods handle localStorage
}

/**
 * Check if interest calculation is needed for a member
 */
export function needsInterestCalculation(member: Member): boolean {
  if (!member.loanBalance || member.loanBalance <= 0) {
    return false;
  }

  const calculation = calculateAccumulatedInterest(member);
  return calculation.monthsToCalculate > 0 && calculation.totalInterest > 0;
}

/**
 * Get interest calculation summary without updating
 */
export function getInterestCalculationSummary(member: Member) {
  return calculateAccumulatedInterest(member);
}
