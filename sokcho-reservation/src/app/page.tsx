"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Reservation {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export default function Home() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [showNameInput, setShowNameInput] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSelectingEnd, setIsSelectingEnd] = useState(false);

  const fetchReservations = async () => {
    try {
      const res = await fetch("/api/reservations");
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();

      // 데이터가 배열인지 확인하고, 아니면 빈 배열로 설정
      if (Array.isArray(data)) {
        setReservations(data);
      } else {
        console.error("Received data is not an array:", data);
        setReservations([]);
      }
    } catch (err) {
      console.error("Failed to fetch reservations:", err);
      setReservations([]); // 오류 시 빈 배열로 설정
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);
  // handleReserve 함수 수정 - 충돌 검사 추가
  const handleReserve = async () => {
    if (!selectedStartDate || !selectedEndDate || !name.trim()) {
      setError("모든 정보를 입력해주세요.");
      return;
    }

    if (selectedStartDate >= selectedEndDate) {
      setError("종료일은 시작일보다 늦어야 합니다.");
      return;
    }

    // 다른 예약과의 충돌 확인
    const checkConflicts = async () => {
      // 편집 모드일 때는 자신의 예약을 제외하고 검사
      const existingReservations =
        editMode && selectedReservation
          ? reservations.filter((r) => r.id !== selectedReservation.id)
          : reservations;

      for (const reservation of existingReservations) {
        const reservStart = new Date(reservation.startDate);
        const reservEnd = new Date(reservation.endDate);

        // 날짜 범위 충돌 검사
        if (
          (selectedStartDate <= reservEnd && selectedEndDate >= reservStart) ||
          (reservStart <= selectedEndDate && reservEnd >= selectedStartDate)
        ) {
          return true; // 충돌 발견
        }
      }
      return false; // 충돌 없음
    };

    const hasConflict = await checkConflicts();
    if (hasConflict) {
      setError("선택한 날짜에 이미 다른 예약이 있습니다.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const url =
        editMode && selectedReservation
          ? `/api/reservations/${selectedReservation.id}`
          : "/api/reservations";

      const method = editMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          startDate: formatDateForAPI(selectedStartDate), // 변경된 부분
          endDate: formatDateForAPI(selectedEndDate), // 변경된 부분
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "예약 처리 중 오류가 발생했습니다.");
        return;
      }

      resetSelection();
      fetchReservations();
    } catch (err) {
      console.error("Reservation error:", err);
      setError(
        editMode
          ? "예약 수정 중 오류가 발생했습니다."
          : "예약 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };
  // 예약 삭제 함수
  const handleDeleteReservation = async (reservationId: number) => {
    if (!confirm("정말로 이 예약을 취소하시겠습니까?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "예약 취소 중 오류가 발생했습니다.");
        return;
      }

      setShowReservationModal(false);
      setSelectedReservation(null);
      fetchReservations();
    } catch (err) {
      console.error("Delete error:", err);
      setError("예약 취소 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setEditMode(true);
    setName(reservation.name);

    // 편집을 위한 초기 날짜 설정 - 수정된 부분
    setSelectedStartDate(parseDate(reservation.startDate));
    setSelectedEndDate(parseDate(reservation.endDate));

    // 예약 정보 모달을 닫고 이름 입력 모달 표시
    setShowReservationModal(false);
    setShowNameInput(true);
  };

  // 색상 배열 추가 (컴포넌트 상단에 추가)
  const reservationColors = [
    {
      bg: "from-rose-100 to-pink-100",
      text: "text-rose-800",
      hover: "hover:from-rose-200 hover:to-pink-200",
    },
    {
      bg: "from-blue-100 to-indigo-100",
      text: "text-blue-800",
      hover: "hover:from-blue-200 hover:to-indigo-200",
    },
    {
      bg: "from-green-100 to-emerald-100",
      text: "text-green-800",
      hover: "hover:from-green-200 hover:to-emerald-200",
    },
    {
      bg: "from-amber-100 to-yellow-100",
      text: "text-amber-800",
      hover: "hover:from-amber-200 hover:to-yellow-200",
    },
    {
      bg: "from-purple-100 to-violet-100",
      text: "text-purple-800",
      hover: "hover:from-purple-200 hover:to-violet-200",
    },
    {
      bg: "from-cyan-100 to-sky-100",
      text: "text-cyan-800",
      hover: "hover:from-cyan-200 hover:to-sky-200",
    },
  ];

  // isDateInReservation 함수 수정
  const isDateInReservation = (date: Date) => {
    if (!Array.isArray(reservations) || reservations.length === 0) {
      return null;
    }

    // 시간대 이슈 방지를 위해 날짜만 비교
    const dateStr = formatDateForAPI(date);

    const reservation = reservations.find((r) => {
      const start = r.startDate; // 이미 YYYY-MM-DD 형식
      const end = r.endDate; // 이미 YYYY-MM-DD 형식
      return dateStr >= start && dateStr <= end;
    });

    if (!reservation) return null;

    // 해당 날짜가 예약의 시작일, 중간, 종료일 중 어디에 해당하는지 확인
    const start = reservation.startDate;
    const end = reservation.endDate;

    // 예약 ID를 기반으로 색상 인덱스 계산 (일관된 색상 유지)
    const colorIndex = reservation.id % reservationColors.length;
    const color = reservationColors[colorIndex];

    return {
      ...reservation,
      isStart: dateStr === start,
      isEnd: dateStr === end,
      isMiddle: dateStr !== start && dateStr !== end,
      color,
    };
  };

  const isDatePast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isDateInSelectedRange = (date: Date) => {
    if (!selectedStartDate || !selectedEndDate) return false;
    return date >= selectedStartDate && date <= selectedEndDate;
  };

  const isDateAvailableForSelection = (date: Date) => {
    if (isDatePast(date)) return false;

    const reservation = isDateInReservation(date);

    if (
      reservation &&
      editMode &&
      selectedReservation &&
      reservation.id === selectedReservation.id
    ) {
      return true;
    }

    if (reservation) return false;

    if (selectedStartDate && !selectedEndDate) {
      if (date < selectedStartDate) return false;

      const current = new Date(selectedStartDate);
      current.setDate(current.getDate() + 1);

      while (current <= date) {
        const currentReservation = isDateInReservation(current);
        if (
          currentReservation &&
          (!editMode ||
            !selectedReservation ||
            currentReservation.id !== selectedReservation.id)
        ) {
          return false;
        }
        current.setDate(current.getDate() + 1);
      }
    }

    return true;
  };

  const handleDateClick = (date: Date) => {
    if (!isDateAvailableForSelection(date)) {
      const reservation = isDateInReservation(date);
      if (reservation) {
        setSelectedReservation(reservation);
        setShowReservationModal(true);
      }
      return;
    }

    if (!selectedStartDate) {
      setSelectedStartDate(date);
      setIsSelectingEnd(true);
    } else if (!selectedEndDate) {
      if (date < selectedStartDate) {
        setSelectedStartDate(date);
      } else {
        setSelectedEndDate(date);
        setShowNameInput(true);
        setIsSelectingEnd(false);
      }
    } else {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
      setIsSelectingEnd(true);
    }
  };

  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const monthNames = [
    "1월",
    "2월",
    "3월",
    "4월",
    "5월",
    "6월",
    "7월",
    "8월",
    "9월",
    "10월",
    "11월",
    "12월",
  ];
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  const resetSelection = () => {
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    setIsSelectingEnd(false);
    setShowNameInput(false);
    setEditMode(false);
    setSelectedReservation(null);
    setName("");
    setError("");
  };

  const calendarDays = generateCalendar();

  return (
    <div className="h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50 flex flex-col overflow-hidden">
      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-6 flex flex-col overflow-hidden">
        {/* 에러 메시지 표시 */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4"
            >
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-red-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <span className="text-red-800 text-sm">{error}</span>
                <button
                  onClick={() => setError("")}
                  className="ml-auto text-red-500 hover:text-red-700"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 선택 상태 표시 */}
        <AnimatePresence>
          {(selectedStartDate || selectedEndDate) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-4 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-medium text-gray-700">
                    {editMode
                      ? "예약 수정"
                      : isSelectingEnd
                      ? "종료일 선택"
                      : "예약 기간"}
                  </div>
                  {selectedStartDate && (
                    <div className="flex items-center space-x-2">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs font-medium">
                        {selectedStartDate.getMonth() + 1}/
                        {selectedStartDate.getDate()}
                      </span>
                      {selectedEndDate && (
                        <>
                          <span className="text-gray-400 text-xs">~</span>
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs font-medium">
                            {selectedEndDate.getMonth() + 1}/
                            {selectedEndDate.getDate()}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={resetSelection}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100/50 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* 달력 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6 flex flex-col overflow-hidden"
        >
          {/* 달력 헤더 */}
          <div className="flex items-center justify-between mb-4"></div>
          <div className="flex items-center justify-between mb-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={prevMonth}
              className="p-2 rounded-xl bg-gray-100/50 hover:bg-gray-200/50 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </motion.button>

            <motion.h2
              key={currentDate.getMonth()}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-gray-800"
            >
              {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
            </motion.h2>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={nextMonth}
              className="p-2 rounded-xl bg-gray-100/50 hover:bg-gray-200/50 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </motion.button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-2 mb-3">
            {weekDays.map((day, index) => (
              <div
                key={day}
                className={`p-2 text-center text-xs font-semibold ${
                  index === 0
                    ? "text-red-500"
                    : index === 6
                    ? "text-blue-500"
                    : "text-gray-600"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 달력 날짜들 */}
          <div className="grid grid-cols-7 gap-2 flex-1">
            {calendarDays.map((date, index) => {
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const isToday = date.toDateString() === new Date().toDateString();
              const isPast = isDatePast(date);
              const reservationInfo = isDateInReservation(date);
              const isSelected =
                selectedStartDate?.toDateString() === date.toDateString() ||
                selectedEndDate?.toDateString() === date.toDateString();
              const isInRange = isDateInSelectedRange(date);
              const isAvailable = isDateAvailableForSelection(date);

              let dateClass =
                "relative h-12 p-1 text-center cursor-pointer rounded-xl transition-all duration-200 flex flex-col justify-center items-center group ";

              if (!isCurrentMonth) {
                dateClass += "text-gray-300 cursor-default ";
              } else if (isPast) {
                dateClass += "text-gray-400 cursor-not-allowed bg-gray-50/50 ";
              } else if (reservationInfo) {
                const isEditingThisReservation =
                  editMode &&
                  selectedReservation &&
                  reservationInfo.id === selectedReservation.id;

                if (isEditingThisReservation) {
                  // 수정 중인 예약에 특별한 색상 적용
                  dateClass += `bg-gradient-to-br from-amber-100 to-orange-100 text-amber-800 hover:from-amber-200 hover:to-orange-200 cursor-pointer `;
                } else {
                  // 각 예약마다 다른 색상 적용
                  dateClass += `bg-gradient-to-br ${reservationInfo.color.bg} ${reservationInfo.color.text} ${reservationInfo.color.hover} cursor-pointer `;
                }
              } else if (isSelected) {
                dateClass +=
                  "bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-md scale-105 ";
              } else if (isInRange) {
                dateClass +=
                  "bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-800 ";
              } else if (isAvailable) {
                dateClass +=
                  "text-gray-700 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:scale-105 ";
              } else {
                dateClass += "text-gray-400 cursor-not-allowed ";
              }

              if (isToday && isCurrentMonth) {
                dateClass += "ring-2 ring-blue-400 ";
              }

              return (
                <motion.div
                  key={index}
                  whileHover={
                    isAvailable || reservationInfo ? { scale: 1.05 } : {}
                  }
                  whileTap={
                    isAvailable || reservationInfo ? { scale: 0.95 } : {}
                  }
                  className={dateClass}
                  onClick={() => isCurrentMonth && handleDateClick(date)}
                >
                  <div className="text-sm font-semibold">{date.getDate()}</div>
                  {/* {reservationInfo && reservationInfo.isStart && (
                    <div className="text-xs truncate w-full px-1 font-medium">
                      {reservationInfo.name}
                    </div>
                  )} */}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* 예약 상세 정보 모달 */}
        <AnimatePresence>
          {showReservationModal && selectedReservation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 w-full max-w-sm shadow-xl border border-white/20"
              >
                <h3 className="text-xl font-bold mb-4 text-gray-800">
                  예약 정보
                </h3>

                <div className="space-y-3 mb-6">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">예약자</div>
                    <div className="font-semibold text-gray-800">
                      {selectedReservation.name}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">예약 기간</div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm font-medium">
                        {(() => {
                          try {
                            const date = parseDate(
                              selectedReservation.startDate
                            );
                            return date.toLocaleDateString();
                          } catch (err) {
                            console.error("Error displaying date:", err);
                            return "날짜 오류";
                          }
                        })()}
                      </span>
                      <span className="text-gray-400">~</span>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm font-medium">
                        {(() => {
                          try {
                            const date = parseDate(selectedReservation.endDate);
                            return date.toLocaleDateString();
                          } catch (err) {
                            console.error("Error displaying date:", err);
                            return "날짜 오류";
                          }
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowReservationModal(false)}
                    className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                  >
                    닫기
                  </button>
                  <button
                    onClick={() => handleEditReservation(selectedReservation)}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm"
                  >
                    수정
                  </button>
                  <button
                    onClick={() =>
                      handleDeleteReservation(selectedReservation.id)
                    }
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors text-sm"
                  >
                    취소
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showNameInput && selectedStartDate && selectedEndDate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 w-full max-w-md shadow-xl border border-white/20"
              >
                <h3 className="text-xl font-bold mb-4 text-gray-800">
                  {editMode ? "예약 수정" : "예약 정보 입력"}
                </h3>

                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    예약 기간
                  </div>

                  {/* 날짜 선택 섹션 */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        시작일
                      </label>
                      <input
                        type="date"
                        value={formatDateForAPI(selectedStartDate) || ""}
                        onChange={(e) => {
                          try {
                            if (e.target.value) {
                              const newDate = parseDate(e.target.value);
                              if (!isNaN(newDate.getTime())) {
                                setSelectedStartDate(newDate);
                              }
                            }
                          } catch (err) {
                            console.error("Error handling date input:", err);
                          }
                        }}
                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        종료일
                      </label>
                      <input
                        type="date"
                        value={formatDateForAPI(selectedEndDate)}
                        onChange={(e) => {
                          const newDate = parseDate(e.target.value);
                          if (!isNaN(newDate.getTime())) {
                            setSelectedEndDate(newDate);
                          }
                        }}
                        min={formatDateForAPI(selectedStartDate)}
                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center justify-center space-x-2">
                      <span className="bg-blue-100 text-blue-800 px-4 py-1.5 rounded-lg text-md font-mono">
                        {selectedStartDate.getMonth() + 1}/
                        {selectedStartDate.getDate()}
                      </span>
                      <span className="text-gray-400 text-md">~</span>
                      <span className="bg-blue-100 text-blue-800 px-4 py-1.5 rounded-lg text-md font-mono">
                        {selectedEndDate.getMonth() + 1}/
                        {selectedEndDate.getDate()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    예약자 이름
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="이름을 입력하세요"
                    autoFocus
                  />
                </div>

                {/* 날짜 관련 오류 메시지 표시 */}
                {selectedStartDate >= selectedEndDate && (
                  <div className="mb-4 text-red-500 text-sm bg-red-50 p-2 rounded-lg">
                    종료일은 시작일보다 늦어야 합니다.
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowNameInput(false);
                      resetSelection();
                    }}
                    className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleReserve}
                    disabled={loading || selectedStartDate >= selectedEndDate}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 transition-all text-sm font-medium"
                  >
                    {loading ? "처리 중..." : editMode ? "수정" : "예약"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// 날짜 포맷 및 파싱 함수 수정
const formatDateForAPI = (date: Date | null): string => {
  if (!date || isNaN(date.getTime())) return "";

  // 로컬 시간대 기준으로 YYYY-MM-DD 형식 반환
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDate = (dateString: string): Date => {
  try {
    // 입력값 검증
    if (!dateString || typeof dateString !== "string") {
      console.error("Invalid date string provided:", dateString);
      return new Date(); // 기본값 반환
    }

    // YYYY-MM-DD 형식 확인
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      // 날짜 문자열을 파싱할 때 시간대 문제를 방지하기 위해 "T00:00:00" 추가
      const [year, month, day] = dateString.split("-").map(Number);

      // 시간 컴포넌트 없이 로컬 날짜로 직접 생성 (시간대 이슈 방지)
      const date = new Date(year, month - 1, day);
      return date;
    } else {
      console.warn("Date string not in YYYY-MM-DD format:", dateString);
      // 다른 형식의 날짜 문자열 처리 시도
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        // 날짜는 유효하지만 시간대 이슈가 있을 수 있으므로 로컬 날짜만 추출
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
      }
      return new Date();
    }
  } catch (err) {
    console.error("Error parsing date:", err);
    return new Date();
  }
};
