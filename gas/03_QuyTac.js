// Kiểm tra logic trong một biểu 01/PCTN (hàm thuần). Lấy từ bộ quy tắc của bảng theo dõi đôn đốc
// (..\apps_script\client.html, hàm raSoat) – sửa quy tắc chung thì sửa cả hai nơi.
// Quy tắc viết theo "số chỉ số" (cột Số chỉ số của biểu); số liệu truyền vào theo mã chỉ tiêu.

var BC_QT_LE = [ // [vế trái (tổng), vế phải, mức, giải thích]
  [['8'], '7', 'SAI', 'Số cuộc thanh tra đã ban hành kết luận không thể lớn hơn tổng số cuộc thanh tra'],
  [['15'], '14', 'SAI', 'Số CQ, TC, ĐV vi phạm công khai, minh bạch không thể lớn hơn số được kiểm tra'],
  [['21', '22'], '20', 'SAI', 'Số người bị xử lý (hành chính + hình sự) không thể lớn hơn số người vi phạm định mức, tiêu chuẩn, chế độ'],
  [['34', '35'], '33', 'SAI', 'DVC trực tuyến toàn trình + một phần không thể lớn hơn tổng số DVC trực tuyến'],
  [['65'], '64', 'SAI', 'Số vụ việc phản ánh đã được xem xét không thể lớn hơn số vụ việc có phản ánh'],
  [['66'], '65', 'XEM', 'Số vụ phát hiện qua xem xét phản ánh lớn hơn số phản ánh đã được xem xét'],
  [['102'], '101', 'SAI', 'Số tổ chức khu vực ngoài nhà nước được thanh tra không thể lớn hơn số thuộc phạm vi quản lý'],
  [['103'], '101', 'SAI', 'Số tổ chức bị xử lý không thể lớn hơn số thuộc phạm vi quản lý'],
  [['106'], '105', 'SAI', 'Số đối tượng bị xử lý hình sự không thể lớn hơn số đối tượng được phát hiện (khu vực ngoài nhà nước)'],
  [['32'], '31', 'XEM', 'Số CBCCVC được chuyển đổi vị trí lớn hơn số phải chuyển đổi'],
  [['41'], '40', 'XEM', 'Số người được xác minh tài sản, thu nhập lớn hơn số người kê khai trong kỳ'],
  [['81'], '80', 'XEM', 'Số người đứng đầu bị xử lý hình sự lớn hơn số bị kết luận thiếu trách nhiệm'],
  [['82'], '80', 'XEM', 'Số người đứng đầu bị kỷ luật lớn hơn số bị kết luận thiếu trách nhiệm'],
  [['24'], '23', 'XEM', 'Giá trị đã thu hồi lớn hơn giá trị kiến nghị thu hồi (định mức, tiêu chuẩn, chế độ)'],
  [['91'], '89', 'XEM', 'Tiền đã thu hồi lớn hơn thiệt hại phát hiện (có thể do thu hồi của kỳ trước)'],
  [['92'], '90', 'XEM', 'Đất đã thu hồi lớn hơn đất bị thiệt hại phát hiện (có thể do thu hồi của kỳ trước)'],
  [['97', '99'], '95', 'XEM', 'Số vụ trong cơ quan thanh tra bị xử lý lớn hơn số vụ phát hiện'],
  [['98'], '96', 'XEM', 'Số đối tượng trong cơ quan thanh tra bị xử lý hình sự lớn hơn số đối tượng phát hiện'],
  [['100'], '96', 'XEM', 'Số đối tượng trong cơ quan thanh tra bị kỷ luật lớn hơn số đối tượng phát hiện']
];
var BC_QT_EQ = [['43', ['43.1', '43.2']], ['82', ['82.1', '82.2', '82.3']], ['84', ['84.1', '84.2', '84.3', '84.4']], ['91', ['91.1', '91.2']], ['92', ['92.1', '92.2']]];
var BC_QT_IMPLY = [ // [nếu a > 0 thì b phải > 0, mức, giải thích]
  ['9', '7', 'SAI', 'Có đơn vị được thanh tra nhưng không có cuộc thanh tra trách nhiệm PCTN'],
  ['7', '9', 'XEM', 'Có cuộc thanh tra trách nhiệm PCTN nhưng không ghi số đơn vị được thanh tra'],
  ['19', '20', 'SAI', 'Có vụ vi phạm định mức, tiêu chuẩn, chế độ nhưng không có người vi phạm'],
  ['20', '19', 'SAI', 'Có người vi phạm định mức, tiêu chuẩn, chế độ nhưng không có vụ vi phạm'],
  ['28', '27', 'SAI', 'Có giá trị quà tặng nộp lại nhưng không có người nộp lại'],
  ['27', '28', 'XEM', 'Có người nộp lại quà tặng nhưng không ghi giá trị'],
  ['37', '36', 'XEM', 'Có vụ vi phạm thanh toán không dùng tiền mặt nhưng không có cuộc kiểm tra, thanh tra'],
  ['15', '14', 'SAI', 'Có đơn vị vi phạm công khai, minh bạch nhưng không có đơn vị được kiểm tra'],
  ['43', '40', 'XEM', 'Có người bị kỷ luật về kiểm soát tài sản, thu nhập nhưng không có người kê khai trong kỳ']
];
var BC_QT_PAIR = [['12', '13'], ['44', '45'], ['46', '47'], ['48', '49'], ['50', '51'], ['52', '53'], ['54', '55'], ['56', '57'], ['58', '59'], ['60', '61'], ['62', '63'], ['66', '67'], ['68', '69'], ['70', '71'], ['72', '73'], ['74', '75'], ['95', '96'], ['104', '105']];
var BC_QT_DEM = /^(người|lượt người|vụ|vụ việc|cuộc|lớp|văn bản|đơn vị|tập thể|đối tượng|cq, tc, đv|tổ chức|thủ tục|tài liệu)$/i;

// chiTieu: BC_CHI_TIEU; v: { mã: số } của MỘT báo cáo; laXa: đơn vị là xã, phường
// Trả về [{ muc: 'SAI'|'XEM', so: [số chỉ số liên quan], nd }]
function bcKiemTra(chiTieu, v, laXa) {
  var KQ = [], maCua = {}, i;
  chiTieu.forEach(function (r) { if (r[5] && r[1] && !maCua[r[1]]) maCua[r[1]] = r[0]; });
  var g = function (s) { var x = v ? v[maCua[s]] : 0; return typeof x === 'number' && isFinite(x) ? x : 0; };
  var sum = function (l) { return l.reduce(function (t, s) { return t + g(s); }, 0); };
  var f = function (x) { return (Math.round(x * 1000) / 1000).toLocaleString('vi-VN'); };
  var bao = function (muc, so, nd) { KQ.push({ muc: muc, so: so, nd: nd }); };

  chiTieu.forEach(function (r) {
    if (!r[5]) return; var x = v ? v[r[0]] : 0; if (typeof x !== 'number' || !isFinite(x)) return;
    var nhan = r[1] ? 'CT ' + r[1] : r[2];
    if (x < 0) bao('SAI', [r[1]], nhan + ': giá trị âm (' + f(x) + ')');
    if (BC_QT_DEM.test(r[3]) && Math.round(x) !== x) bao('SAI', [r[1]], nhan + ' (' + r[3] + '): chỉ tiêu đếm phải là số nguyên (' + f(x) + ')');
  });
  var p39 = g('39'); if (p39 < 0 || p39 > 100) bao('SAI', ['39'], 'CT 39: tỷ lệ ngoài 0–100% (' + f(p39) + ')');
  BC_QT_LE.forEach(function (q) { var a = sum(q[0]), b = g(q[1]); if (a > b) bao(q[2], q[0].concat([q[1]]), 'CT ' + q[0].join(' + ') + ' (' + f(a) + ') > CT ' + q[1] + ' (' + f(b) + '): ' + q[3]); });
  BC_QT_EQ.forEach(function (q) { var a = g(q[0]), b = sum(q[1]); if (Math.abs(a - b) > 1e-9 && (a || b)) bao('SAI', [q[0]].concat(q[1]), 'CT ' + q[0] + ' (' + f(a) + ') ≠ tổng CT ' + q[1].join(' + ') + ' (' + f(b) + ')'); });
  BC_QT_IMPLY.forEach(function (q) { if (g(q[0]) > 0 && g(q[1]) === 0) bao(q[2], [q[0], q[1]], 'CT ' + q[0] + ' = ' + f(g(q[0])) + ' nhưng CT ' + q[1] + ' = 0: ' + q[3]); });
  BC_QT_PAIR.forEach(function (q) {
    var a = g(q[0]), b = g(q[1]);
    if (a > 0 && b === 0) bao('SAI', q, 'CT ' + q[0] + ' có ' + f(a) + ' vụ nhưng số đối tượng (CT ' + q[1] + ') = 0');
    else if (b > 0 && a === 0) bao('SAI', q, 'CT ' + q[1] + ' có ' + f(b) + ' đối tượng nhưng số vụ (CT ' + q[0] + ') = 0');
    else if (a > 0 && b < a) bao('XEM', q, 'Số đối tượng (CT ' + q[1] + ' = ' + f(b) + ') ít hơn số vụ (CT ' + q[0] + ' = ' + f(a) + ')');
  });
  var d33 = g('33'), d3435 = g('34') + g('35');
  if (d33 > d3435) bao('XEM', ['33', '34', '35'], 'CT 33 (' + f(d33) + ') > CT 34 + 35 (' + f(d3435) + '): tổng DVC trực tuyến thường bằng toàn trình + một phần');
  if (laXa) { var t = sum(['95', '96', '97', '98', '99', '100']); if (t > 0) bao('XEM', ['95', '96', '97', '98', '99', '100'], 'Xã, phường có số liệu mục "trong ngành thanh tra" (CT 95–100 = ' + f(t) + ') – mục này dành cho cơ quan thanh tra'); }
  return KQ;
}

if (typeof module !== 'undefined') module.exports = { bcKiemTra: bcKiemTra };
