"use client";

import React, { useState, useEffect, useCallback } from "react";

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  isLate?: boolean;
  lateDays?: number;
  lateHours?: number;
  lateMinutes?: number;
}

interface CountdownTimerProps {
  deadline: string | number | bigint;
  onExpire?: () => void;
  showLateTime?: boolean;
  className?: string;
  variant?: "compact" | "detailed";
}

export default function CountdownTimer({
  deadline,
  onExpire,
  showLateTime = false,
  className = "",
  variant = "compact",
}: CountdownTimerProps) {
  const calculateTimeRemaining = useCallback((): TimeRemaining => {
    const now = Math.floor(Date.now() / 1000);
    const deadlineNum = Number(deadline);
    const difference = deadlineNum - now;

    if (difference <= 0) {
      const lateDifference = Math.abs(difference);
      const lateDays = Math.floor(lateDifference / (60 * 60 * 24));
      const lateHours = Math.floor(
        (lateDifference % (60 * 60 * 24)) / (60 * 60),
      );
      const lateMinutes = Math.floor((lateDifference % (60 * 60)) / 60);

      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true,
        isLate: true,
        lateDays,
        lateHours,
        lateMinutes,
      };
    }

    const days = Math.floor(difference / (60 * 60 * 24));
    const hours = Math.floor((difference % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((difference % (60 * 60)) / 60);
    const seconds = difference % 60;

    return {
      days,
      hours,
      minutes,
      seconds,
      isExpired: false,
      isLate: false,
    };
  }, [deadline]);

  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(
    calculateTimeRemaining(),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = calculateTimeRemaining();
      setTimeRemaining(newTime);

      if (newTime.isExpired && !timeRemaining.isExpired && onExpire) {
        onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeRemaining, onExpire, timeRemaining.isExpired]);

  if (timeRemaining.isExpired) {
    if (showLateTime && timeRemaining.isLate) {
      const { lateDays = 0, lateHours = 0, lateMinutes = 0 } = timeRemaining;
      let lateText = "Late by ";
      if (lateDays > 0) lateText += `${lateDays}d ${lateHours}h`;
      else if (lateHours > 0) lateText += `${lateHours}h ${lateMinutes}m`;
      else lateText += `${lateMinutes}m`;

      return (
        <span
          className={`font-black text-rose-500 uppercase tracking-widest ${className}`}
        >
          {lateText}
        </span>
      );
    }

    return (
      <span
        className={`font-black text-rose-500 uppercase tracking-widest ${className}`}
      >
        Deadline Passed
      </span>
    );
  }

  const { days, hours, minutes, seconds } = timeRemaining;

  if (variant === "compact") {
    return (
      <div className={`flex items-baseline gap-1 font-black ${className}`}>
        {days > 0 && (
          <span className="flex items-baseline gap-0.5">
            <span>{days}</span>
            <span className="text-[8px] opacity-40 uppercase">d</span>
          </span>
        )}
        {(days > 0 || hours > 0) && (
          <span className="flex items-baseline gap-0.5">
            <span>{hours}</span>
            <span className="text-[8px] opacity-40 uppercase">h</span>
          </span>
        )}
        <span className="flex items-baseline gap-0.5">
          <span>{minutes}</span>
          <span className="text-[8px] opacity-40 uppercase">m</span>
        </span>
        {days === 0 && (
          <span className="flex items-baseline gap-0.5">
            <span>{seconds}</span>
            <span className="text-[8px] opacity-40 uppercase">s</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${className}`}>
      {days > 0 && (
        <div className="flex flex-col items-center">
          <span className="text-xl font-black">{days}</span>
          <span className="text-[8px] font-black uppercase tracking-widest opacity-40">
            Days
          </span>
        </div>
      )}
      <div className="flex flex-col items-center">
        <span className="text-xl font-black">{hours}</span>
        <span className="text-[8px] font-black uppercase tracking-widest opacity-40">
          Hours
        </span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-xl font-black">{minutes}</span>
        <span className="text-[8px] font-black uppercase tracking-widest opacity-40">
          Mins
        </span>
      </div>
      {days === 0 && (
        <div className="flex flex-col items-center">
          <span className="text-xl font-black">{seconds}</span>
          <span className="text-[8px] font-black uppercase tracking-widest opacity-40">
            Secs
          </span>
        </div>
      )}
    </div>
  );
}
