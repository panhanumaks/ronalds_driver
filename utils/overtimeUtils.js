export function isWeekend() {
  const day = new Date().getDay();
  return day === 6 || day === 0;
}

export function isAfterSevenPM(checkOutTime) {
  const [hours] = checkOutTime.split(":");
  return parseInt(hours) >= 19;
}

export function calculateOvertimeWeekday(checkOutTime) {
  const [hours, minutes] = checkOutTime.split(":").map(Number);
  let overtimeHours = hours - 19;
  if (minutes > 30) {
    overtimeHours += 1;
  }
  return overtimeHours;
}

export function calculateOvertimeWeekend(checkOutTime) {
  const [hours, minutes] = checkOutTime.split(":").map(Number);
  let overtimeHours = hours;
  if (minutes > 30) {
    overtimeHours += 1;
  }
  return overtimeHours;
}

export function calculateOvertime(checkInTime, checkOutTime) {
  const [checkInHour, checkInMinute] = checkInTime.split(":").map(Number);
  const [checkOutHour, checkOutMinute] = checkOutTime.split(":").map(Number);

  const overtimeStartHour = 19;

  let overtimeMinutes = 0;

  if (checkOutHour >= overtimeStartHour) {
    if (checkInHour < overtimeStartHour) {
      overtimeMinutes =
        checkOutHour * 60 + checkOutMinute - overtimeStartHour * 60;
    } else {
      overtimeMinutes =
        checkOutHour * 60 + checkOutMinute - (checkInHour * 60 + checkInMinute);
    }
  }

  let overtimeHours = Math.floor(overtimeMinutes / 60);
  if (overtimeMinutes % 60 > 30) {
    overtimeHours += 1;
  }

  return overtimeHours;
}
