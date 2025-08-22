export default function handler(req, res) {
  const now = new Date();

  return res.status(200).json({
    message: 'API funcionando!',
    timestamp: now.toISOString(),
    timezone: 'UTC',
    brasilia_time: new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(now),
    day_of_week: now.getDay(),
    is_workday: now.getDay() >= 1 && now.getDay() <= 5,
  });
}
