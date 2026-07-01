import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendJobAssignedToWorkerEmail } from '@/lib/email';
import { createNotification } from '@/lib/notifications';
import { processSellerCommission } from '@/lib/seller-commissions';

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

    // Email + notification to worker on manual assignment
    if (assignWorker && assignWorker !== null) {
      const { workerId } = assignWorker;
      prisma.user.findUnique({ where: { id: workerId }, select: { email: true, name: true } })
        .then(async (worker) => {
          if (!worker) return;
          if (process.env.RESEND_API_KEY) {
            sendJobAssignedToWorkerEmail(worker.email, worker.name, printJob.fileName, printJob.serviceType)
              .catch((e) => console.error('Admin assignment email error:', e));
          }
          createNotification({ userId: workerId, type: 'job_update', title: 'Nuevo trabajo asignado', body: `Se te asignó el trabajo: ${printJob.fileName}`, link: '/worker' }).catch(() => {});
        })
        .catch(() => {});
    }

    // Notify client on price quote
    if (setPrice !== undefined) {
      createNotification({ userId: printJob.userId, type: 'job_update', title: 'Tu trabajo fue cotizado', body: `El trabajo "${printJob.fileName}" recibió una cotización. Revisa y acepta o apela.`, link: '/dashboard?tab=servicios' }).catch(() => {});
    }

    // Notify client when payment confirmed
    if (confirmPayment) {
      createNotification({ userId: printJob.userId, type: 'job_update', title: 'Pago confirmado', body: `El pago de "${printJob.fileName}" fue confirmado. Tu trabajo será procesado.`, link: '/dashboard?tab=servicios' }).catch(() => {});
      processSellerCommission(id).catch(() => {});
    }

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
