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
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSelectingEnd, setIsSelectingEnd] = useState(false);

  const fetchReservations = async () => {
    try {
      const res = await fetch("/api/reservations");
      const data = await res.json();
      setReservations(data);
    } catch (err) {
      console.error("Failed to fetch reservations:", err);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleReserve = async () => {
    if (!selectedStartDate || !selectedEndDate || !name.trim()) {
      setError("모든 정보를 입력해주세요.");
      return;
    }

    if (selectedStartDate >= selectedEndDate) {
      setError("종료일은 시작일보다 늦어야 합니다.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          startDate: selectedStartDate.toISOString().split("T")[0],
          endDate: selectedEndDate.toISOString().split("T")[0],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error);
        return;
      }

      setName("");
      setSelectedStartDate(null);
      setSelectedEndDate(null);
      setShowNameInput(false);
      setIsSelectingEnd(false);
      fetchReservations();
    } catch (err) {
      setError("예약 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const isDateInReservation = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return reservations.find((r) => {
      const start = new Date(r.startDate).toISOString().split("T")[0];
      const end = new Date(r.endDate).toISOString().split("T")[0];
      return dateStr >= start && dateStr <= end;
    });
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
    if (isDateInReservation(date)) return false;

    if (selectedStartDate && !selectedEndDate) {
      // 시작일이 선택되었고 종료일을 선택하는 중
      if (date < selectedStartDate) return false;

      // 시작일과 클릭한 날짜 사이에 예약이 있는지 확인
      const current = new Date(selectedStartDate);
      current.setDate(current.getDate() + 1);

      while (current <= date) {
        if (isDateInReservation(current)) return false;
        current.setDate(current.getDate() + 1);
      }
    }

    return true;
  };

  const handleDateClick = (date: Date) => {
    if (!isDateAvailableForSelection(date)) {
      const reservation = isDateInReservation(date);
      if (reservation) {
        const start = new Date(reservation.startDate).toLocaleDateString();
        const end = new Date(reservation.endDate).toLocaleDateString();
        alert(`예약자: ${reservation.name}\n기간: ${start} ~ ${end}`);
      }
      return;
    }

    if (!selectedStartDate) {
      // 시작일 선택
      setSelectedStartDate(date);
      setIsSelectingEnd(true);
    } else if (!selectedEndDate) {
      // 종료일 선택
      if (date < selectedStartDate) {
        setSelectedStartDate(date);
      } else {
        setSelectedEndDate(date);
        setShowNameInput(true);
        setIsSelectingEnd(false);
      }
    } else {
      // 다시 시작일부터 선택
      setSelectedStartDate(date);
      setSelectedEndDate(null);
      setIsSelectingEnd(true);
    }
  };

  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
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
    setName("");
    setError("");
  };

  const calendarDays = generateCalendar();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40"
      >
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="text-center">
            <motion.h1
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2"
            >
              🏖️ 속초 별장
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-gray-600 font-medium"
            >
              가족 별장 예약 시스템
            </motion.p>
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* 선택 상태 표시 */}
        <AnimatePresence>
          {(selectedStartDate || selectedEndDate) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-6 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-lg font-semibold text-gray-800">
                    {isSelectingEnd ? "종료일을 선택하세요" : "예약 기간"}
                  </div>
                  {selectedStartDate && (
                    <div className="flex items-center space-x-2">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {selectedStartDate.toLocaleDateString()}
                      </span>
                      {selectedEndDate && (
                        <>
                          <span className="text-gray-400">~</span>
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            {selectedEndDate.toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={resetSelection}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 mb-8 border border-gray-200/50"
        >
          {/* 달력 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={prevMonth}
              className="p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors shadow-sm"
            >
              <svg
                className="w-6 h-6"
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
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-gray-800"
            >
              {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
            </motion.h2>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={nextMonth}
              className="p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors shadow-sm"
            >
              <svg
                className="w-6 h-6"
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
          <div className="grid grid-cols-7 gap-2 mb-4">
            {weekDays.map((day, index) => (
              <div
                key={day}
                className={`p-4 text-center text-sm font-semibold ${
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
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((date, index) => {
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const isToday = date.toDateString() === new Date().toDateString();
              const isPast = isDatePast(date);
              const reservation = isDateInReservation(date);
              const isSelected =
                selectedStartDate?.toDateString() === date.toDateString() ||
                selectedEndDate?.toDateString() === date.toDateString();
              const isInRange = isDateInSelectedRange(date);
              const isAvailable = isDateAvailableForSelection(date);

              let dateClass =
                "relative h-16 p-2 text-center cursor-pointer rounded-2xl transition-all duration-300 flex flex-col justify-center items-center group ";

              if (!isCurrentMonth) {
                dateClass += "text-gray-300 cursor-default ";
              } else if (isPast) {
                dateClass += "text-gray-400 cursor-not-allowed bg-gray-50 ";
              } else if (reservation) {
                dateClass +=
                  "bg-gradient-to-br from-red-100 to-red-200 text-red-800 hover:from-red-200 hover:to-red-300 cursor-pointer ";
              } else if (isSelected) {
                dateClass +=
                  "bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg scale-105 ";
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
                dateClass += "ring-2 ring-blue-400 ring-offset-2 ";
              }

              return (
                <motion.div
                  key={index}
                  whileHover={isAvailable ? { scale: 1.05 } : {}}
                  whileTap={isAvailable ? { scale: 0.95 } : {}}
                  className={dateClass}
                  onClick={() => isCurrentMonth && handleDateClick(date)}
                >
                  <div className="text-lg font-semibold">{date.getDate()}</div>
                  {reservation && (
                    <div className="text-xs mt-1 truncate w-full px-1 font-medium">
                      {reservation.name}
                    </div>
                  )}

                  {/* 호버 효과 */}
                  {isAvailable && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl"
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* 범례 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8 border border-gray-200/50"
        >
          <h3 className="text-xl font-bold mb-4 text-gray-800">범례</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg mr-3 shadow-sm"></div>
              <span className="font-medium">예약 가능</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gradient-to-br from-red-100 to-red-200 rounded-lg mr-3 shadow-sm"></div>
              <span className="font-medium">예약됨</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gray-50 rounded-lg mr-3 shadow-sm"></div>
              <span className="font-medium">지난 날짜</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 border-2 border-blue-400 rounded-lg mr-3"></div>
              <span className="font-medium">오늘</span>
            </div>
          </div>
        </motion.div>

        {/* 예약 입력 모달 */}
        <AnimatePresence>
          {showNameInput && selectedStartDate && selectedEndDate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-200/50"
              >
                <h3 className="text-2xl font-bold mb-6 text-gray-800">
                  예약 정보 입력
                </h3>

                <div className="mb-6">
                  <div className="text-sm text-gray-600 mb-2">예약 기간</div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-center space-x-2">
                      <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-xl font-semibold">
                        {selectedStartDate.toLocaleDateString()}
                      </span>
                      <span className="text-gray-400 font-bold">~</span>
                      <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-xl font-semibold">
                        {selectedEndDate.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-center mt-2 text-sm text-gray-600">
                      {Math.ceil(
                        (selectedEndDate.getTime() -
                          selectedStartDate.getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}
                      박{" "}
                      {Math.ceil(
                        (selectedEndDate.getTime() -
                          selectedStartDate.getTime()) /
                          (1000 * 60 * 60 * 24)
                      ) + 1}
                      일
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    예약자 이름
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
                    placeholder="이름을 입력하세요"
                    autoFocus
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-red-500 text-sm mb-6 bg-red-50 p-3 rounded-xl"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowNameInput(false);
                      resetSelection();
                    }}
                    className="flex-1 px-6 py-4 text-gray-600 border-2 border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors font-semibold"
                  >
                    취소
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleReserve}
                    disabled={loading}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 transition-all font-semibold shadow-lg"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        예약 중...
                      </div>
                    ) : (
                      "예약하기"
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
