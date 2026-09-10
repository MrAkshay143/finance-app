import { RecordStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.js';
import { toPaise } from '../utils/currency.js';
import { logAuditEvent } from './auditService.js';
import { invalidateDashboardCache } from './dashboardService.js';
import { emitDashboardRefresh } from '../sockets/socketGateway.js';

export interface CreateGoalData {
  name: string;
  targetAmount: number | bigint;
  currentAmount?: number | bigint;
  targetDate?: string | Date | null;
  category?: string | null;
}

export interface UpdateGoalData {
  name?: string;
  targetAmount?: number | bigint;
  currentAmount?: number | bigint;
  targetDate?: string | Date | null;
  category?: string | null;
}

export function formatGoal(g: any) {
  const targetPaise = BigInt(g.targetAmount || 0);
  const currentPaise = BigInt(g.currentAmount || 0);
  const targetAmount = Number(targetPaise) / 100;
  const currentAmount = Number(currentPaise) / 100;
  const remainingPaise = targetPaise > currentPaise ? targetPaise - currentPaise : BigInt(0);
  const remainingAmount = Number(remainingPaise) / 100;
  const progress =
    targetPaise > BigInt(0)
      ? Math.min(100, Math.round((Number(currentPaise) / Number(targetPaise)) * 100 * 10) / 10)
      : 0;

  return {
    id: g.id,
    userId: g.userId,
    name: g.name,
    targetAmount,
    targetAmountPaise: Number(targetPaise),
    currentAmount,
    currentAmountPaise: Number(currentPaise),
    remainingAmount,
    remainingAmountPaise: Number(remainingPaise),
    progress,
    percentage: progress,
    targetDate: g.targetDate,
    status: g.status as RecordStatus,
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
  };
}

export class GoalService {

  // Return active goals for user with calculated progress
  async listGoals(userId: string) {
    const goals = await prisma.goal.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });

    return goals.map(formatGoal);
  }

  /**
   * Retrieves single goal by ID.
   */
  async getGoal(userId: string, id: string) {
    const goal = await prisma.goal.findUnique({
      where: { id },
    });

    if (!goal) {
      throw new NotFoundError('Goal not found');
    }
    if (goal.userId !== userId) {
      throw new ForbiddenError('Access forbidden to this goal');
    }

    return formatGoal(goal);
  }

  /**
   * Creates a goal converting targetAmount and currentAmount to BigInt paise.
   */
  async createGoal(userId: string, data: CreateGoalData) {
    if (!data.name?.trim()) {
      throw new ValidationError('Goal name is required');
    }

    const targetAmountPaise = toPaise(data.targetAmount, false);
    const currentAmountPaise = toPaise(data.currentAmount, true);
    const targetDate = data.targetDate ? new Date(data.targetDate) : null;

    const goal = await prisma.goal.create({
      data: {
        userId,
        name: data.name.trim(),
        targetAmount: targetAmountPaise,
        currentAmount: currentAmountPaise,
        targetDate,
        status: 'ACTIVE',
      },
    });

    await logAuditEvent({
      actorUserId: userId,
      action: 'GOAL_CREATE',
      details: {
        goalId: goal.id,
        name: goal.name,
        targetAmountPaise: targetAmountPaise.toString(),
        currentAmountPaise: currentAmountPaise.toString(),
      },
    });

    await invalidateDashboardCache(userId);
    try {
      emitDashboardRefresh(userId);
    } catch {}

    return formatGoal(goal);
  }

  /**
   * Updates an existing goal.
   */
  async updateGoal(userId: string, id: string, data: UpdateGoalData) {
    const existing = await prisma.goal.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Goal not found');
    }
    if (existing.userId !== userId) {
      throw new ForbiddenError('Access forbidden to this goal');
    }
    if (existing.status === 'DELETED') {
      throw new ValidationError('Cannot update a deleted goal');
    }

    const targetAmountPaise =
      data.targetAmount !== undefined
        ? toPaise(data.targetAmount, false)
        : existing.targetAmount;

    const currentAmountPaise =
      data.currentAmount !== undefined
        ? toPaise(data.currentAmount, true)
        : existing.currentAmount;

    const targetDate =
      data.targetDate !== undefined
        ? data.targetDate ? new Date(data.targetDate) : null
        : existing.targetDate;

    const updated = await prisma.goal.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name.trim() : existing.name,
        targetAmount: targetAmountPaise,
        currentAmount: currentAmountPaise,
        targetDate,
      },
    });

    await logAuditEvent({
      actorUserId: userId,
      action: 'GOAL_UPDATE',
      details: {
        goalId: id,
        newTargetAmountPaise: targetAmountPaise.toString(),
        newCurrentAmountPaise: currentAmountPaise.toString(),
      },
    });

    await invalidateDashboardCache(userId);
    try {
      emitDashboardRefresh(userId);
    } catch {}

    return formatGoal(updated);
  }

  /**
   * Soft deletes a goal by setting status = DELETED.
   */
  async deleteGoal(userId: string, id: string) {
    const existing = await prisma.goal.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Goal not found');
    }
    if (existing.userId !== userId) {
      throw new ForbiddenError('Access forbidden to this goal');
    }
    if (existing.status === 'DELETED') {
      throw new ValidationError('Goal is already deleted');
    }

    await prisma.goal.update({
      where: { id },
      data: { status: 'DELETED' },
    });

    await logAuditEvent({
      actorUserId: userId,
      action: 'GOAL_DELETE',
      details: {
        goalId: id,
      },
    });

    await invalidateDashboardCache(userId);
    try {
      emitDashboardRefresh(userId);
    } catch {}

    return { message: 'Goal deleted successfully' };
  }
}

export const goalService = new GoalService();
export default goalService;
