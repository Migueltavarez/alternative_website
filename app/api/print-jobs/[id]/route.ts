import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { creditsCost, status, notes, deductCredits, assignWorker, setPrice, validatePrice, confirmPayment, paymentNotes } = body;

    const printJob = await prisma.printJob.findUnique({
      where: { id },
    });

    if (!printJob) {
      return NextResponse.json(
        { error: 'Print job not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (creditsCost !== undefined) updateData.creditsCost = creditsCost;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    // Manual worker assignment by admin
    if (assignWorker !== undefined) {
      if (assignWorker === null) {
        // Unassign
        updateData.assignedWorkerId = null;
        updateData.assignedMachineId = null;
        updateData.assignedAt = null;
        updateData.acceptedAt = null;
        updateData.startedAt = null;
        updateData.status = 'pending';
      } else {
        const { workerId, machineId } = assignWorker;

        if (machineId) {
          const machine = await prisma.printerMachine.findUnique({
            where: { id: machineId },
            include: { workerProfile: { select: { userId: true } } },
          });
          if (!machine || machine.workerProfile.userId !== workerId) {
            return NextResponse.json({ error: 'Máquina o worker inválido' }, { status: 400 });
          }
        } else {
          // Machine-less assignment (e.g. design jobs assigned to a Designer)
          const workerProfile = await prisma.workerProfile.findUnique({ where: { userId: workerId } });
          if (!workerProfile) {
            return NextResponse.json({ error: 'Worker inválido' }, { status: 400 });
          }
        }

        updateData.assignedWorkerId = workerId;
        updateData.assignedMachineId = machineId || null;
        updateData.assignedAt = new Date();
        updateData.acceptedAt = null;
        updateData.startedAt = null;
        updateData.status = 'assigned';
      }
    }

    // Admin: set price quote
    if (setPrice !== undefined) {
      updateData.price = parseFloat(setPrice);
      updateData.priceStatus = 'quoted';
    }

    // Admin: validate price (after accept or appeal)
    if (validatePrice !== undefined) {
      updateData.priceStatus = 'validated';
      if (validatePrice.price !== undefined && validatePrice.price !== '') {
        updateData.price = parseFloat(validatePrice.price);
      }
    }

    // Admin: confirm payment
    if (confirmPayment) {
      updateData.priceStatus = 'confirmed';
      updateData.paidAt = new Date();
      if (paymentNotes) updateData.paymentNotes = paymentNotes;
    }

    const currentCredits = printJob.creditsCost || 0;
    const newCredits = creditsCost !== undefined ? creditsCost : currentCredits;

    if ((deductCredits || (newCredits > 0 && currentCredits === 0)) && newCredits > 0 && !printJob.creditsDeducted) {
      const user = await prisma.user.findUnique({
        where: { id: printJob.userId },
        select: { credits: true },
      });

      if (!user || user.credits < newCredits) {
        return NextResponse.json(
          { error: 'El usuario no tiene suficientes créditos' },
          { status: 400 }
        );
      }

      await prisma.user.update({
        where: { id: printJob.userId },
        data: {
          credits: {
            decrement: newCredits,
          },
        },
      });

      updateData.creditsDeducted = true;
    }

    const updated = await prisma.printJob.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            credits: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update print job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    await prisma.printJob.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete print job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
