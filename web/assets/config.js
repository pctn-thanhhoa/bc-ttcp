// Địa chỉ máy chủ (Web App Apps Script). Chạy tại máy (tools/serve.js) thì dùng máy chủ giả /api.
var BC_API_THAT = 'https://script.google.com/macros/s/AKfycbwyNd_fjZUr3cQqZireu0PtUhX8ykUhoKe2EaR5Y1Ur61-xJoKg2oFiG05Nt-0nbneL/exec';
var BC_API = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? '/api' : BC_API_THAT;
