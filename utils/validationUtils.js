export function validatePhoneNumber(phone) {
  const phoneRegex = /^[0-9]{10,15}$/;
  return phoneRegex.test(phone);
}
