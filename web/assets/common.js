// Dùng chung cho trang đơn vị và trang quản trị
var BC_WEB = (function () {
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var khongDau = function (s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase(); };
  var fmt = function (x) { return typeof x === 'number' && isFinite(x) ? (Math.round(x * 1000) / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 3 }) : ''; };
  // Đọc số người dùng gõ: "1.234,5" (kiểu Việt Nam), "1234.5", "1 234"
  var docSo = function (s) {
    s = String(s == null ? '' : s).replace(/\s/g, '');
    if (s === '') return null;
    if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    if (!/^-?\d+(\.\d+)?$/.test(s)) return NaN;
    return Number(s);
  };
  var goi = async function (body) {
    var r;
    try { r = await fetch(BC_API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) }); }
    catch (e) { throw new Error('Không kết nối được máy chủ. Đề nghị kiểm tra mạng rồi thử lại.'); }
    var j; try { j = await r.json(); } catch (e) { throw new Error('Máy chủ trả về dữ liệu không hợp lệ (mã ' + r.status + ').'); }
    if (!j.ok) throw new Error(j.loi || 'Lỗi không rõ.');
    return j;
  };
  var lay = async function (q) {
    var r;
    try { r = await fetch(BC_API + '?' + q); } catch (e) { throw new Error('Không kết nối được máy chủ. Đề nghị kiểm tra mạng rồi thử lại.'); }
    var j = await r.json(); if (!j.ok) throw new Error(j.loi || 'Lỗi không rõ.'); return j;
  };
  var tenKy = function (ky) { return 'tháng ' + (+ky.slice(5)) + '/' + ky.slice(0, 4); };
  return { $: $, esc: esc, khongDau: khongDau, fmt: fmt, docSo: docSo, goi: goi, lay: lay, tenKy: tenKy };
})();
