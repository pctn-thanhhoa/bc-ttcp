// Danh sách các biểu trang hỗ trợ: 01/PCTN và 6 biểu tiếp công dân, khiếu nại, tố cáo (TT 06/2025/TT-TTCP) – dùng chung máy chủ, trang web, kiểm thử.
// Cấu hình 6 biểu viết theo SỐ CỘT (thứ tự ô nhập của mẫu trên bcth, đánh từ 1) rồi đổi sang mã chỉ tiêu khi dựng.
//
// Cách tính lũy kế "cách B" (Trưởng phòng chốt 20/11/2026): ô tổng có cả phần kỳ trước chuyển sang (ton) thì
//   lũy kế = phần đã xong lũy kế đến tháng trước + số tháng này. Xem chú thích các kiểu ở 02_TinhToan.js.
// Diễn giải của người viết mã, cần phòng rà lại khi dùng thật:
//   - 03/GQKN, 04/GQTC cột 4 "Tổng số vụ việc": phần đã xong = số quyết định/kết luận đã ban hành + không thụ lý + rút đơn;
//     cột 6 "Đã thụ lý giải quyết" lũy kế = cột 4 − cột 5 − cột 7 − cột 8 (để biểu vẫn cân).
//   - 05/KQTH các cột "phải thu", "phải trả": phần đã xong = "đã thu", "đã trả" tương ứng.
//   - 06/QLKNTC cột 6, 8, 17 không có cột "đã xong" đi kèm -> kiểu TAY (gợi ý cộng thẳng, đơn vị tự sửa).
var BC_CAU_HINH_KNTC = {
  '01TCD': {
    ten: '01/TCD', tieuDe: 'Tổng hợp kết quả tiếp công dân thường xuyên, định kỳ và đột xuất',
    congThuc: [{ m: 1, c: [5, 11, 17] }, { m: 2, c: [6, 12, 18] }, { m: 3, c: [7, 13, 19] }, { m: 4, c: [8, 14, 20] }]
  },
  '02XLD': {
    ten: '02/XLD', tieuDe: 'Tổng hợp kết quả xử lý đơn',
    ton: { 1: [2] },
    congThuc: [{ m: 6, c: [7, 8] }, { m: 12, c: [13, 14] }, { m: 19, c: [20, 21, 22] }, { m: 23, c: [24, 25] }, { m: 4, c: [6, 12, 19] }, { m: 3, c: [4, 23] }],
    le: [[2, 1], [3, 2], [5, 4]], eq: [[6, [9, 10, 11]], [12, [15, 16, 17, 18]]]
  },
  '03GQKN': {
    ten: '03/GQKN', tieuDe: 'Tổng hợp kết quả giải quyết khiếu nại',
    dau: [2], diem: [5], ton: { 4: [9, 7, 8] },
    congThuc: [{ m: 4, c: [5, 6, 7, 8], a: 'T' }, { m: 6, c: [4], t: [5, 7, 8], a: 'CQ' }, { m: 1, c: [2, 3] }, { m: 9, c: [10, 11, 12, 13, 14] }],
    le: [[4, 1], [22, 21], [25, 24]]
  },
  '04GQTC': {
    ten: '04/GQTC', tieuDe: 'Tổng hợp kết quả giải quyết tố cáo',
    dau: [2], diem: [5], ton: { 4: [9, 7, 8] },
    congThuc: [{ m: 4, c: [5, 6, 7, 8], a: 'T' }, { m: 6, c: [4], t: [5, 7, 8], a: 'CQ' }, { m: 1, c: [2, 3] }, { m: 9, c: [10, 11, 12, 13, 14, 15] }],
    le: [[4, 1], [24, 23], [27, 26]]
  },
  '05KQTH': {
    ten: '05/KQTH', tieuDe: 'Tổng hợp kết quả thi hành quyết định, thực hiện kết luận',
    ton: { 1: [2], 3: [5], 4: [6], 7: [9], 8: [10], 16: [17], 18: [20], 19: [21], 22: [24], 23: [25] },
    le: [[2, 1], [12, 11], [15, 14], [17, 16], [28, 27], [31, 30]]
  },
  '06QLKNTC': {
    ten: '06/QLKNTC', tieuDe: 'Tổng hợp công tác quản lý nhà nước về tiếp công dân, giải quyết khiếu nại, tố cáo',
    ton: { 7: [9] }, tay: [6, 8, 17],
    le: [[9, 7]]
  }
};
// Đối chiếu giữa các biểu (báo cáo tháng): [biểu a, cột a, quan hệ, biểu b, cột b]
var BC_DOI_CHIEU_CHEO = [
  ['03GQKN', 3, '=', '02XLD', 6, 'Đơn khiếu nại tiếp nhận trong kỳ (03/GQKN cột 3) thường bằng số đơn khiếu nại thuộc thẩm quyền (02/XLD cột 6)'],
  ['04GQTC', 3, '=', '02XLD', 12, 'Đơn tố cáo tiếp nhận trong kỳ (04/GQTC cột 3) thường bằng số đơn tố cáo thuộc thẩm quyền (02/XLD cột 12)'],
  ['05KQTH', 1, '>=', '03GQKN', 9, 'Số quyết định phải thi hành (05/KQTH cột 1) không nhỏ hơn số quyết định ban hành trong kỳ (03/GQKN cột 9)'],
  ['05KQTH', 16, '>=', '04GQTC', 9, 'Số kết luận phải thực hiện (05/KQTH cột 16) không nhỏ hơn số kết luận ban hành trong kỳ (04/GQTC cột 9)']
];

var BC_DS_BIEU_ = null;
function bcDsBieu() {
  if (BC_DS_BIEU_) return BC_DS_BIEU_;
  var ds = [{ id: '01PCTN', ten: '01/PCTN', tieuDe: 'Tổng hợp kết quả về công tác phòng, chống tham nhũng, lãng phí, tiêu cực', kieu: 'DOC', sheet: 'SO_LIEU', chiTieu: BC_CHI_TIEU }];
  Object.keys(BC_CAU_HINH_KNTC).forEach(function (id) {
    var c = BC_CAU_HINH_KNTC[id], chiTieu = BC_DM_KNTC[id], cot = chiTieu.filter(function (r) { return r[5]; });
    var ma = function (n) { if (!cot[n - 1]) throw new Error('Biểu ' + id + ': không có cột ' + n); return cot[n - 1][0]; };
    var ms = {}; cot.forEach(function (r, i) { ms[r[0]] = i + 1; });
    var loai = {};
    (c.dau || []).forEach(function (n) { loai[ma(n)] = { k: 'DAU' }; });
    (c.diem || []).forEach(function (n) { loai[ma(n)] = { k: 'DIEM' }; });
    (c.tay || []).forEach(function (n) { loai[ma(n)] = { k: 'TAY' }; });
    Object.keys(c.ton || {}).forEach(function (n) { loai[ma(+n)] = { k: 'TON', d: c.ton[n].map(ma) }; });
    var b = {
      id: id, ten: c.ten, tieuDe: c.tieuDe, kieu: 'NGANG', sheet: 'SL_' + id, chiTieu: chiTieu, cot: cot, ms: ms, loai: loai,
      congThuc: (c.congThuc || []).map(function (f) { return { ma: ma(f.m), cong: (f.c || []).map(ma), tru: (f.t || []).map(ma), ap: f.a || '*' }; }),
      le: (c.le || []).map(function (x) { return [ma(x[0]), ma(x[1])]; }),
      eq: (c.eq || []).map(function (x) { return [ma(x[0]), x[1].map(ma)]; })
    };
    b.ghiChu = bcGhiChuBieu_(b, c);
    ds.push(b);
  });
  BC_DS_BIEU_ = ds;
  return ds;
}
function bcBieu(id) { var ds = bcDsBieu(); for (var i = 0; i < ds.length; i++) if (ds[i].id === id) return ds[i]; return null; }

// Ghi chú hiển thị dưới biểu, sinh từ cấu hình (số cột theo mẫu trên bcth)
function bcGhiChuBieu_(b, c) {
  var g = [], cot = function (n) { return '(' + n + ')'; };
  (c.congThuc || []).forEach(function (f) {
    var ve = (f.c || []).map(cot).join(' + ') + (f.t || []).map(function (n) { return ' − ' + cot(n); }).join('');
    g.push('Cột ' + cot(f.m) + ' = ' + ve + (f.a === 'T' ? ' ở báo cáo tháng' : f.a === 'CQ' ? ' ở báo cáo lũy kế, quý' : '') + ' – trang tự tính, không nhập.');
  });
  Object.keys(c.ton || {}).forEach(function (n) {
    g.push('Cột ' + cot(n) + ' gồm cả phần kỳ trước chuyển sang nên lũy kế (quý) = cột ' + c.ton[n].map(cot).join(' + ') + ' lũy kế đến tháng trước + cột ' + cot(n) + ' tháng này (không cộng thẳng các tháng để tránh đếm trùng phần tồn).');
  });
  (c.dau || []).forEach(function (n) { g.push('Cột ' + cot(n) + ' (kỳ trước chuyển sang): lũy kế giữ số đầu năm, quý lấy số tháng đầu quý.'); });
  (c.diem || []).forEach(function (n) { g.push('Cột ' + cot(n) + ' là số tại thời điểm báo cáo: lũy kế, quý lấy số tháng này.'); });
  (c.tay || []).forEach(function (n) { g.push('Cột ' + cot(n) + ': biểu không đủ thông tin để tính lũy kế chính xác – trang gợi ý bằng cách cộng thẳng, đơn vị rà lại và sửa trực tiếp ở dòng lũy kế (quý) nếu cần.'); });
  (c.le || []).forEach(function (x) { g.push('Cột ' + cot(x[0]) + ' không lớn hơn cột ' + cot(x[1]) + '.'); });
  (c.eq || []).forEach(function (x) { g.push('Cột ' + cot(x[0]) + ' = ' + x[1].map(cot).join(' + ') + ' (phân loại theo lĩnh vực).'); });
  g.push('Các cột còn lại là số phát sinh trong kỳ: lũy kế = số lũy kế đã gửi trên bcth + số tháng này.');
  return g;
}

// Kiểm tra logic trong một báo cáo của một biểu. Trả về [{ muc, ma: [mã liên quan], nd }]
function bcKiemTraBieu(bieu, v, laXa) {
  if (bieu.id === '01PCTN') {
    var maCua = {}; bieu.chiTieu.forEach(function (r) { if (r[5] && r[1] && !maCua[r[1]]) maCua[r[1]] = r[0]; });
    return bcKiemTra(bieu.chiTieu, v, laXa).map(function (x) { return { muc: x.muc, ma: x.so.map(function (s) { return maCua[s]; }), nd: x.nd }; });
  }
  var KQ = [], g = function (m) { var x = v ? v[m] : 0; return typeof x === 'number' && isFinite(x) ? x : 0; };
  var f = function (x) { return (Math.round(x * 1000) / 1000).toLocaleString('vi-VN'); }, c = function (m) { return '(' + bieu.ms[m] + ')'; };
  bieu.cot.forEach(function (r) {
    var x = g(r[0]);
    if (x < 0) KQ.push({ muc: 'SAI', ma: [r[0]], nd: 'Cột ' + c(r[0]) + ' âm (' + f(x) + ')' });
    else if (Math.round(x) !== x && !/tr|đ|m2|%/i.test(r[3])) KQ.push({ muc: 'SAI', ma: [r[0]], nd: 'Cột ' + c(r[0]) + ' phải là số nguyên (' + f(x) + ')' });
  });
  bieu.le.forEach(function (q) { if (g(q[0]) > g(q[1])) KQ.push({ muc: 'SAI', ma: q, nd: 'Cột ' + c(q[0]) + ' (' + f(g(q[0])) + ') lớn hơn cột ' + c(q[1]) + ' (' + f(g(q[1])) + ')' }); });
  bieu.eq.forEach(function (q) {
    var s = q[1].reduce(function (t, m) { return t + g(m); }, 0);
    if (s !== g(q[0]) && (s || g(q[0]))) KQ.push({ muc: 'SAI', ma: [q[0]].concat(q[1]), nd: 'Cột ' + c(q[0]) + ' (' + f(g(q[0])) + ') khác tổng cột ' + q[1].map(c).join(' + ') + ' (' + f(s) + ')' });
  });
  return KQ;
}

// Đối chiếu giữa các biểu trên báo cáo tháng. thang: { idBiểu: {mã: số} }. Trả về [{ muc: 'XEM', bieu, ma, nd }]
function bcKiemTraCheo(thang) {
  var KQ = [];
  BC_DOI_CHIEU_CHEO.forEach(function (q) {
    var a = bcBieu(q[0]), b = bcBieu(q[3]), va = thang[q[0]], vb = thang[q[3]];
    if (!a || !b || !va || !vb || !Object.keys(va).length || !Object.keys(vb).length) return;
    var x = +va[a.cot[q[1] - 1][0]] || 0, y = +vb[b.cot[q[4] - 1][0]] || 0;
    if ((q[2] === '=' && x !== y) || (q[2] === '>=' && x < y)) KQ.push({ muc: 'XEM', bieu: q[0], ma: [a.cot[q[1] - 1][0]], nd: q[5] + ': ' + x + ' / ' + y });
  });
  return KQ;
}

if (typeof module !== 'undefined') module.exports = { bcDsBieu: bcDsBieu, bcBieu: bcBieu, bcKiemTraBieu: bcKiemTraBieu, bcKiemTraCheo: bcKiemTraCheo, BC_CAU_HINH_KNTC: BC_CAU_HINH_KNTC };
