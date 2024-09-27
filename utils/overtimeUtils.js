import moment from "moment";

export function isWeekend() {
  const day = new Date().getDay();
  return day === 6 || day === 0;
}

export function calculateOvertime(
  checkInTimestamp,
  checkOutTimestamp,
  dayOfWeek
) {
  const checkInMoment = moment(checkInTimestamp);
  const checkOutMoment = moment(checkOutTimestamp);

  let totalWorkMinutes = checkOutMoment.diff(checkInMoment, "minutes");

  const workHoursLimit = 10;
  const normalWorkDuration = workHoursLimit * 60;

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
