export function formatWhatsApp(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function whatsAppLink(number, name, jobTitle) {
  const digits = number.replace(/\D/g, '');
  const international = digits.startsWith('55') ? digits : `55${digits}`;
  const text = encodeURIComponent(
    `Olá ${name}! 👋 Entramos em contato referente à sua candidatura para a vaga de *${jobTitle}*. Gostaríamos de conversar mais sobre o seu perfil. Qual seria um bom horário para uma conversa rápida? 😊`
  );
  return `https://wa.me/${international}?text=${text}`;
}

export function isValidWhatsApp(number) {
  return number.replace(/\D/g, '').length >= 10;
}
