// Tính số lũy kế, quý từ số liệu các tháng (hàm thuần – dùng chung cho máy chủ, trang web, kiểm thử).
// Kỳ: 'YYYY-MM'. Loại báo cáo của một kỳ: T = tháng; C = cộng dồn từ đầu năm (lũy kế tháng / 6 tháng / 9 tháng / năm); Q = quý.
// Số liệu một báo cáo: { <mã chỉ tiêu>: số }.

var BC_THOI_DIEM = ['33', '34', '35']; // số chỉ số là số thời điểm (DVC trực tuyến đang cung cấp): không cộng dồn, lấy số tháng báo cáo
var BC_TY_LE = ['39'];                 // tỷ lệ %: không cộng dồn

function bcKy(nam, thang) { return nam + '-' + (thang < 10 ? '0' : '') + thang; }
function bcTachKy(ky) { return { nam: +String(ky).slice(0, 4), thang: +String(ky).slice(5, 7) }; }
function bcKySau(ky) { var k = bcTachKy(ky); return k.thang === 12 ? bcKy(k.nam + 1, 1) : bcKy(k.nam, k.thang + 1); }

// Cách cộng của từng chỉ tiêu: 'CONG' (cộng dồn theo thời gian), 'DIEM' (thời điểm), 'TYLE'
function bcLoaiCT(row) {
  if (BC_THOI_DIEM.indexOf(row[1]) >= 0) return 'DIEM';
  if (BC_TY_LE.indexOf(row[1]) >= 0 || row[3] === '%') return 'TYLE';
  return 'CONG';
}

// Các báo cáo biểu 01/PCTN phải lập trên bcth của một tháng (theo thứ tự hiển thị)
function bcBoBaoCao(ky) {
  var k = bcTachKy(ky), t = k.thang, bo = [{ k: 'T', ten: 'Tháng ' + t, mau: '01/PCTN - THÁNG' }];
  if (t % 3 !== 0) bo.push({ k: 'C', ten: 'Lũy kế ' + t + ' tháng', mau: '01/PCTN - LK THÁNG' });
  else {
    bo.push({ k: 'Q', ten: 'Quý ' + ['I', 'II', 'III', 'IV'][t / 3 - 1], mau: '01/PCTN - QUÝ' });
    if (t === 6) bo.push({ k: 'C', ten: '6 tháng', mau: '01/PCTN - 6 THÁNG' });
    if (t === 9) bo.push({ k: 'C', ten: '9 tháng', mau: '01/PCTN - 9 THÁNG' });
    if (t === 12) bo.push({ k: 'C', ten: 'Năm ' + k.nam, mau: '01/PCTN - NĂM' });
  }
  return bo;
}

// Tên báo cáo cộng dồn của một tháng đã qua (để ghi nguồn số gốc)
function bcTenCongDon(thang) {
  if (thang === 3) return 'quý I';
  if (thang === 6) return '6 tháng';
  if (thang === 9) return '9 tháng';
  if (thang === 12) return 'năm';
  return 'lũy kế ' + thang + ' tháng';
}

// Báo cáo cộng dồn từ đầu năm của một tháng trong lịch sử (tháng 3: báo cáo quý I chính là số cộng dồn)
function bcCongDonCua(lichSu, nam, thang) {
  var d = lichSu[bcKy(nam, thang)]; if (!d) return null;
  if (d.C) return d.C;
  if (thang === 3 && d.Q) return d.Q;
  return null;
}

// lichSu: { 'YYYY-MM': { T: {mã: số}, C: {...}, Q: {...} } } – số đã đồng bộ từ bcth của MỘT đơn vị (không gồm báo cáo bị trả lại)
// ky: tháng đang nhập; nhap: { mã: số } số tháng này đơn vị gõ (ô trống = không có khóa)
// Trả về { goc, gocTen, gocThang, lk, quy, bo, canhBao: [chuỗi], dong: { mã: [chuỗi cảnh báo của chỉ tiêu] } }
function bcTinh(chiTieu, lichSu, ky, nhap) {
  var k = bcTachKy(ky), nam = k.nam, m = k.thang, i, j;
  var nhapCT = chiTieu.filter(function (r) { return r[5]; });
  var so = function (o, ma) { var v = o ? o[ma] : 0; return typeof v === 'number' && isFinite(v) ? v : 0; };
  var canhBao = [], dong = {};
  var baoDong = function (ma, s) { (dong[ma] = dong[ma] || []).push(s); };
  var T = function (th) { var d = lichSu[bcKy(nam, th)]; return d && d.T ? d.T : null; };

  // 1. Số gốc: số cộng dồn gần nhất trên bcth + các tháng (đã đồng bộ) nằm giữa
  var goc = {}, gocTen = '', gocThang = 0, thieuT = [];
  if (m === 1) gocTen = 'đầu năm (kỳ tháng 1: lũy kế bằng số tháng)';
  else {
    var cd = null;
    for (j = m - 1; j >= 1 && !cd; j--) { cd = bcCongDonCua(lichSu, nam, j); if (cd) gocThang = j; }
    for (j = gocThang + 1; j <= m - 1; j++) if (!T(j)) thieuT.push(j);
    nhapCT.forEach(function (r) {
      var ma = r[0], x = so(cd, ma);
      if (bcLoaiCT(r) === 'CONG') for (j = gocThang + 1; j <= m - 1; j++) x += so(T(j), ma);
      goc[ma] = x;
    });
    if (cd && gocThang === m - 1) gocTen = 'báo cáo ' + bcTenCongDon(gocThang) + ' đã gửi trên bcth';
    else if (cd) {
      gocTen = 'báo cáo ' + bcTenCongDon(gocThang) + ' cộng số các tháng ' + (gocThang + 1) + '–' + (m - 1);
      canhBao.push('Chưa có báo cáo ' + bcTenCongDon(m - 1) + ' của đơn vị trên bcth; số gốc lấy từ ' + gocTen + '.');
    } else {
      gocTen = 'tổng các tháng đã có trên bcth';
      canhBao.push('Chưa có báo cáo cộng dồn nào của năm ' + nam + ' trên bcth; số gốc mới là tổng các tháng đã đồng bộ – đơn vị tự đối chiếu trước khi dùng.');
    }
    if (thieuT.length) canhBao.push('Thiếu báo cáo tháng ' + thieuT.join(', ') + ' trên bcth nên số gốc chưa gồm các tháng này.');

    // Cảnh báo số gốc có dấu hiệu sai (vẫn dùng số trên bcth – đơn vị tự đối chiếu, điều chỉnh trên bcth nếu cần)
    if (cd) nhapCT.forEach(function (r) {
      if (bcLoaiCT(r) !== 'CONG') return;
      var ma = r[0], x = so(cd, ma), tong = 0, lon = 0, thLon = 0;
      for (j = 1; j <= gocThang; j++) {
        tong += so(T(j), ma);
        if (j < gocThang) { var c = bcCongDonCua(lichSu, nam, j); if (c && so(c, ma) > lon) { lon = so(c, ma); thLon = j; } }
      }
      if (x < lon) baoDong(ma, 'Số ' + bcTenCongDon(gocThang) + ' trên bcth (' + x + ') nhỏ hơn số ' + bcTenCongDon(thLon) + ' (' + lon + ')');
      else if (x < tong) baoDong(ma, 'Số ' + bcTenCongDon(gocThang) + ' trên bcth (' + x + ') nhỏ hơn tổng các tháng đã báo cáo (' + tong + ')');
    });
  }

  // 2. Lũy kế đến tháng này, quý
  var lk = {}, quy = null, thieuQ = [];
  if (m % 3 === 0) { quy = {}; for (j = m - 2; j < m; j++) if (!T(j)) thieuQ.push(j); }
  nhapCT.forEach(function (r) {
    var ma = r[0], loai = bcLoaiCT(r), x = so(nhap, ma);
    lk[ma] = loai === 'CONG' ? so(goc, ma) + x : x;
    if (quy) quy[ma] = loai === 'CONG' ? so(T(m - 2), ma) + so(T(m - 1), ma) + x : x;
  });
  if (thieuQ.length) canhBao.push('Thiếu báo cáo tháng ' + thieuQ.join(', ') + ' trên bcth nên số quý chưa gồm các tháng này.');

  var bo = bcBoBaoCao(ky).map(function (b) { return { k: b.k, ten: b.ten, mau: b.mau, so: b.k === 'T' ? nhap : (b.k === 'Q' ? quy : lk) }; });
  return { goc: goc, gocTen: gocTen, gocThang: gocThang, lk: lk, quy: quy, bo: bo, canhBao: canhBao, dong: dong };
}

if (typeof module !== 'undefined') module.exports = { bcKy: bcKy, bcTachKy: bcTachKy, bcKySau: bcKySau, bcLoaiCT: bcLoaiCT, bcBoBaoCao: bcBoBaoCao, bcTenCongDon: bcTenCongDon, bcCongDonCua: bcCongDonCua, bcTinh: bcTinh, BC_THOI_DIEM: BC_THOI_DIEM, BC_TY_LE: BC_TY_LE };
