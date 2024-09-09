export function isWeekend() {
  const day = new Date().getDay();
  return day === 6 || day === 0;
}

export function calculateOvertime(checkInTime, checkOutTime, dayOfWeek) {
  const [checkInHour, checkInMinute] = checkInTime.split(":").map(Number);
  const [checkOutHour, checkOutMinute] = checkOutTime.split(":").map(Number);

  const workHoursLimit = 10;
  const normalWorkDuration = workHoursLimit * 60;

  const checkInTotalMinutes = checkInHour * 60 + checkInMinute;
  const checkOutTotalMinutes = checkOutHour * 60 + checkOutMinute;

  let totalWorkMinutes = checkOutTotalMinutes - checkInTotalMinutes;
  let overtimeMinutes = 0;

  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    if (totalWorkMinutes > normalWorkDuration) {
      overtimeMinutes = totalWorkMinutes - normalWorkDuration;
    }
  } else if (dayOfWeek === 6 || dayOfWeek === 0) {
    overtimeMinutes = totalWorkMinutes;
  }

  let overtimeHours = Math.floor(overtimeMinutes / 60);
  const remainingMinutes = overtimeMinutes % 60;
  if (remainingMinutes > 0) {
    overtimeHours += Math.ceil(remainingMinutes / 15);
  }

  return overtimeHours;
}
