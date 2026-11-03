export const environment = {
  // Рівні 1–2 домашки працюють на моках (?demo) — цю адресу не чіпай.
  // Рівень 3: встав адресу свого бекенду (URL стейджу API Gateway) і перезапусти npm start.
  backendUrl: 'https://kdepzccp2i.execute-api.us-west-2.amazonaws.com/develop',
  // Only local-reservation / local-group / local-invite and their known guest sessions use localhost.
  // All other IDs keep using backendUrl; production explicitly disables this flag.
  localE2E: true,
};
