import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const printJobs = await prisma.printJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(printJobs);
  } catch (error) {
    console.error('Get print jobs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const {
      fileName, fileUrl, fileSize, notes, deliveryTime,
      deliveryType, deliveryAddress,
      serviceType,
      // 3D print
      color, filamentType, scale, realSize,
      // Auto-quote fields
      autoQuoted, quotedPrice, infill, qualityLevel,
      quoteVolumeCm3, quoteBboxX, quoteBboxY, quoteBboxZ,
      // Laser
      laserCutColor, laserEngravColor,
      // Resin
      resinColor, resinUse,
      // Plans
      blueprintSheetSize, blueprintColorMode,
      // Design
      designDescription, designMeasures, designReferenceUrls,
      referenceImageUrls,
      designMaterial, designUse, designIsVehicle,
      designVehicleMake, designVehicleModel, designVehicleYear,
    } = body;

    const NO_FILE_SERVICES = ['design', 'armado_maqueta', 'asesoria'];
    const isDesign = serviceType === 'design';

    if (!fileName || (!fileUrl && !NO_FILE_SERVICES.includes(serviceType))) {
      return NextResponse.json(
        { error: 'fileName y fileUrl son requeridos' },
        { status: 400 }
      );
    }

    if (isDesign && !designDescription) {
      return NextResponse.json(
        { error: 'La descripción del diseño es requerida' },
        { status: 400 }
      );
    }

    const printJob = await prisma.printJob.create({
      data: {
        userId,
        fileName: fileName || 'solicitud',
        fileUrl: fileUrl || '',
        fileSize: fileSize || null,
        notes: notes || null,
        deliveryTime: deliveryTime || 'standard',
        deliveryType: deliveryType || 'pickup',
        deliveryAddress: deliveryAddress || null,
        serviceType: serviceType || 'print_3d',
        status: 'pending',
        creditsCost: 0,
        priceStatus: autoQuoted ? 'validated' : 'unpaid',
        price: autoQuoted && quotedPrice != null ? quotedPrice : null,
        // 3D print
        color: color || null,
        filamentType: filamentType || null,
        scale: scale || null,
        realSize: realSize || null,
        // Auto-quote fields
        autoQuoted: autoQuoted ?? false,
        quotedPrice: quotedPrice ?? null,
        quotedAt: autoQuoted ? new Date() : null,
        infill: infill ?? null,
        qualityLevel: qualityLevel ?? null,
        quoteVolumeCm3: quoteVolumeCm3 ?? null,
        quoteBboxX: quoteBboxX ?? null,
        quoteBboxY: quoteBboxY ?? null,
        quoteBboxZ: quoteBboxZ ?? null,
        // Laser
        laserCutColor: laserCutColor || null,
        laserEngravColor: laserEngravColor || null,
        // Resin
        resinColor: resinColor || null,
        resinUse: resinUse || null,
        // Plans
        blueprintSheetSize: blueprintSheetSize || null,
        blueprintColorMode: blueprintColorMode || null,
        // Design
        designDescription: designDescription || null,
        designMeasures: designMeasures || null,
        designReferenceUrls: designReferenceUrls || null,
        referenceImageUrls: referenceImageUrls || null,
        designMaterial: designMaterial || null,
        designUse: designUse || null,
        designIsVehicle: designIsVehicle || false,
        designVehicleMake: designVehicleMake || null,
        designVehicleModel: designVehicleModel || null,
        designVehicleYear: designVehicleYear || null,
      },
    });

    return NextResponse.json(printJob, { status: 201 });
  } catch (error) {
    console.error('Create print job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
