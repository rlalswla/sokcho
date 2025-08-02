import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 개별 예약 조회
export async function GET(request: NextRequest, { params }: any) {
  try {
    // params 객체 바로 사용
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "잘못된 예약 ID입니다." },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "예약을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json(reservation);
  } catch (error) {
    console.error("Error fetching reservation:", error);
    return NextResponse.json(
      { error: "예약 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 예약 수정
export async function PUT(request: NextRequest, { params }: any) {
  try {
    // params 객체 바로 사용
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "잘못된 예약 ID입니다." },
        { status: 400 }
      );
    }

    const { name, startDate, endDate } = await request.json();
    const start = new Date(startDate);
    const end = new Date(endDate);

    // 해당 ID의 예약이 존재하는지 확인
    const existingReservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!existingReservation) {
      return NextResponse.json(
        { error: "예약을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 다른 예약과 기간이 겹치는지 확인
    const conflictingReservation = await prisma.reservation.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [
              {
                AND: [
                  { startDate: { lte: start } },
                  { endDate: { gte: start } },
                ],
              },
              {
                AND: [{ startDate: { lte: end } }, { endDate: { gte: end } }],
              },
              {
                AND: [{ startDate: { gte: start } }, { endDate: { lte: end } }],
              },
            ],
          },
        ],
      },
    });

    if (conflictingReservation) {
      return NextResponse.json(
        { error: "선택한 기간에 이미 다른 예약이 있습니다." },
        { status: 400 }
      );
    }

    // 예약 수정
    const updatedReservation = await prisma.reservation.update({
      where: { id },
      data: {
        name,
        startDate: start,
        endDate: end,
      },
    });

    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error("Error updating reservation:", error);
    return NextResponse.json(
      { error: "예약 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 예약 삭제
export async function DELETE(request: NextRequest, { params }: any) {
  try {
    const { id } = params;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return NextResponse.json(
        { error: "잘못된 예약 ID입니다." },
        { status: 400 }
      );
    }

    // 해당 ID의 예약이 존재하는지 확인
    const existingReservation = await prisma.reservation.findUnique({
      where: { id: parsedId },
    });

    if (!existingReservation) {
      return NextResponse.json(
        { error: "예약을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 예약 삭제
    await prisma.reservation.delete({
      where: { id: parsedId },
    });

    return NextResponse.json({
      message: "예약이 성공적으로 취소되었습니다.",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting reservation:", error);
    return NextResponse.json(
      { error: "예약 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
