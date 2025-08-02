import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const reservations = await prisma.reservation.findMany({
      orderBy: { startDate: "asc" },
    });
    return NextResponse.json(reservations);
  } catch (error) {
    console.error("Error fetching reservations:", error);
    return NextResponse.json(
      { error: "예약 목록을 가져오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, startDate, endDate } = await req.json();

    const start = new Date(startDate);
    const end = new Date(endDate);

    // 기간이 겹치는 예약이 있는지 확인
    const conflictingReservation = await prisma.reservation.findFirst({
      where: {
        OR: [
          {
            AND: [{ startDate: { lte: start } }, { endDate: { gte: start } }],
          },
          {
            AND: [{ startDate: { lte: end } }, { endDate: { gte: end } }],
          },
          {
            AND: [{ startDate: { gte: start } }, { endDate: { lte: end } }],
          },
        ],
      },
    });

    if (conflictingReservation) {
      return NextResponse.json(
        { error: "선택한 기간에 이미 예약이 있습니다." },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.create({
      data: {
        name,
        startDate: start,
        endDate: end,
      },
    });

    return NextResponse.json(reservation);
  } catch (error: any) {
    console.error("Error creating reservation:", error);

    return NextResponse.json(
      { error: "예약 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
