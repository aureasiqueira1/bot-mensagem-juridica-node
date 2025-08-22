export default function handler(req, res) {
  return res.json({
    message: 'API funcionando!',
    timestamp: new Date().toISOString(),
    success: true,
  });
}
