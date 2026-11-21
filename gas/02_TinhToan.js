// Tính số lũy kế, quý từ số liệu các tháng (hàm thuần – dùng chung cho máy chủ, trang web, kiểm thử).
// Kỳ: 'YYYY-MM'. Loại báo cáo của một kỳ: T = tháng; C = cộng dồn từ đầu năm (lũy kế tháng / 6 tháng / 9 tháng / năm); Q = quý.
// Số liệu một báo cáo: { <mã chỉ tiêu>: số }.
//
// Cách tính của từng chỉ tiêu (bieu.loai[mã].k; không khai báo = CONG):
//   CONG  cộng dồn theo thời gian: lũy kế = số gốc + tháng này
//   DIEM  số tại thời điểm báo cáo: lũy kế = quý = số tháng này          TYLE  tỷ lệ: như DIEM
//   DAU   số kỳ trước chuyển sang: lũy kế giữ số đầu năm (số gốc trên bcth; tháng 1 lấy số tháng 1); quý lấy số tháng đầu quý
//   TON   tổng gồm cả phần kỳ trước chuyển sang (đơn, quyết định phải thi hành…): lũy kế = phần ĐÃ XONG lũy kế đến tháng trước
//         (các chỉ tiêu ở .d) + số tháng này – tránh đếm trùng phần tồn chuyển qua nhiều tháng
//   TAY   không suy ra được từ biểu: gợi ý = cộng thẳng, đơn vị tự sửa ở ô lũy kế/quý (khóa nhập: mã + '@C', mã + '@Q')
// bieu.congThuc: [{ ma, cong: [mã], tru: [mã], ap: '*' | 'T' | 'CQ' }] – cột tự tính, áp theo thứ tự (T: báo cáo tháng; CQ: lũy kế, quý)

var BC_THOI_DIEM = ['33', '34', '35']; // biểu 01/PCTN: số chỉ số là số thời điểm (DVC trực tuyến đang cung cấp)
var BC_TY_LE = ['39'];                 // biểu 01/PCTN: tỷ lệ %

function bcKy(nam, thang) { return nam + '-' + (thang < 10 ? '0' : '') + thang; }
function bcTachKy(ky) { return { nam: +String(ky).slice(0, 4), thang: +String(ky).slice(5, 7) }; }
function bcKySau(ky) { var k = bcTachKy(ky); return k.thang === 12 ? bcKy(k.nam + 1, 1) : bcKy(k.nam, k.thang + 1); }

// Biểu 01/PCTN: suy cách tính từ số chỉ số / đơn vị tính
function bcLoaiCT(row) {
  if (BC_THOI_DIEM.indexOf(row[1]) >= 0) return 'DIEM';
  if (BC_TY_LE.indexOf(row[1]) >= 0 || row[3] === '%') return 'TYLE';
  return 'CONG';
}
function bcLoaiCua(bieu, row) { return bieu.loai ? (bieu.loai[row[0]] || { k: 'CONG' }) : { k: bcLoaiCT(row) }; }

// Các báo cáo phải lập trên bcth của một tháng (theo thứ tự hiển thị); tenBieu: '01/PCTN', '01/TCD'…
function bcBoBaoCao(ky, tenBieu) {
  var k = bcTachKy(ky), t = k.thang, b = tenBieu || '01/PCTN', bo = [{ k: 'T', ten: 'Tháng ' + t, mau: b + ' - THÁNG' }];
  if (t % 3 !== 0) bo.push({ k: 'C', ten: 'Lũy kế ' + t + ' tháng', mau: b + ' - LK THÁNG' });
  else {
    bo.push({ k: 'Q', ten: 'Quý ' + ['I', 'II', 'III', 'IV'][t / 3 - 1], mau: b + ' - QUÝ' });
    if (t === 6) bo.push({ k: 'C', ten: '6 tháng', mau: b + ' - 6 THÁNG' });
    if (t === 9) bo.push({ k: 'C', ten: '9 tháng', mau: b + ' - 9 THÁNG' });
    if (t === 12) bo.push({ k: 'C', ten: 'Năm ' + k.nam, mau: b + ' - NĂM' });
  }
  return bo;
}

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

function bcApCongThuc(bieu, v, loaiBaoCao) {
  (bieu.congThuc || []).forEach(function (f) {
    if (f.ap !== '*' && !(f.ap === 'T' && loaiBaoCao === 'T') && !(f.ap === 'CQ' && loaiBaoCao !== 'T')) return;
    var s = 0, g = function (m) { var x = v[m]; return typeof x === 'number' && isFinite(x) ? x : 0; };
    (f.cong || []).forEach(function (m) { s += g(m); }); (f.tru || []).forEach(function (m) { s -= g(m); });
    v[f.ma] = Math.round(s * 1e6) / 1e6;
  });
  return v;
}

// bieu: { chiTieu, loai?, congThuc? };  lichSu: { 'YYYY-MM': { T: {mã: số}, C: {...}, Q: {...} } } – số đã đồng bộ từ bcth của MỘT đơn vị
// ky: tháng đang nhập;  nhap: { mã: số } số tháng này đơn vị gõ (ô trống = không có khóa; ô TAY: mã@C, mã@Q)
// Trả về { goc, gocTen, gocThang, thang, lk, quy, bo, canhBao: [chuỗi], dong: { mã: [chuỗi] }, tay: { C: {mã: gợi ý}, Q: {...} } }
function bcTinhBieu(bieu, lichSu, ky, nhap) {
  var k = bcTachKy(ky), nam = k.nam, m = k.thang, j;
  var nhapCT = bieu.chiTieu.filter(function (r) { return r[5]; });
  var so = function (o, ma) { var v = o ? o[ma] : 0; return typeof v === 'number' && isFinite(v) ? v : 0; };
  var canhBao = [], dong = {};
  var baoDong = function (ma, s) { (dong[ma] = dong[ma] || []).push(s); };
  var T = function (th) { var d = lichSu[bcKy(nam, th)]; return d && d.T ? d.T : null; };
  var tuTinh = {}; (bieu.congThuc || []).forEach(function (f) { tuTinh[f.ma] = 1; });
  nhap = nhap || {};

  // 1. Số gốc: số cộng dồn gần nhất trên bcth + các tháng (đã đồng bộ) nằm giữa
  var goc = {}, gocTen = '', gocThang = 0, thieuT = [], cd = null, coGi;
  if (m === 1) gocTen = 'đầu năm (kỳ tháng 1: lũy kế bằng số tháng)';
  else {
    for (j = m - 1; j >= 1 && !cd; j--) { cd = bcCongDonCua(lichSu, nam, j); if (cd) gocThang = j; }
    var thangDau = null, soDau = 0; for (j = 1; j < m && !thangDau; j++) { thangDau = T(j); if (thangDau) soDau = j; }
    var coGi = !!(cd || thangDau); // đơn vị đã có báo cáo nào của biểu này trong năm chưa
    for (j = Math.max(gocThang, cd ? 0 : soDau) + 1; j <= m - 1; j++) if (coGi && !T(j)) thieuT.push(j);
    nhapCT.forEach(function (r) {
      var ma = r[0], kieu = bcLoaiCua(bieu, r).k, x = so(cd, ma);
      if (kieu === 'CONG') for (j = gocThang + 1; j <= m - 1; j++) x += so(T(j), ma);
      if (kieu === 'DAU' && !cd) x = so(thangDau, ma);
      goc[ma] = x;
    });
    if (cd && gocThang === m - 1) gocTen = 'báo cáo ' + bcTenCongDon(gocThang) + ' đã gửi trên bcth';
    else if (cd) {
      gocTen = 'báo cáo ' + bcTenCongDon(gocThang) + ' cộng số các tháng ' + (gocThang + 1) + '–' + (m - 1);
      canhBao.push('Chưa có báo cáo ' + bcTenCongDon(m - 1) + ' của đơn vị trên bcth; số gốc lấy từ ' + gocTen + '.');
    } else if (!coGi) {
      gocTen = 'chưa có số liệu trên bcth';
      canhBao.push('Chưa có báo cáo nào của năm ' + nam + ' cho biểu này trên bcth (hoặc chưa đồng bộ); số lũy kế tạm bằng số tháng này – đơn vị tự cộng thêm số các tháng trước nếu có.');
    } else {
      gocTen = 'tổng các tháng đã có trên bcth';
      canhBao.push('Chưa có báo cáo cộng dồn nào của năm ' + nam + ' trên bcth; số gốc mới là tổng các tháng đã đồng bộ – đơn vị tự đối chiếu trước khi dùng.');
    }
    if (thieuT.length) canhBao.push('Thiếu báo cáo tháng ' + thieuT.join(', ') + ' trên bcth nên số gốc chưa gồm các tháng này.');

    // Cảnh báo số gốc chưa thống nhất với số các tháng (số đã gửi trên bcth không thay đổi được – vẫn dùng làm số gốc, chỉ để đơn vị lưu ý)
    if (cd) nhapCT.forEach(function (r) {
      if (bcLoaiCua(bieu, r).k !== 'CONG' || tuTinh[r[0]]) return;
      var ma = r[0], x = so(cd, ma), tong = 0, lon = 0, thLon = 0;
      for (j = 1; j <= gocThang; j++) {
        tong += so(T(j), ma);
        if (j < gocThang) { var c = bcCongDonCua(lichSu, nam, j); if (c && so(c, ma) > lon) { lon = so(c, ma); thLon = j; } }
      }
      if (x < lon) baoDong(ma, 'Số ' + bcTenCongDon(gocThang) + ' trên bcth (' + x + ') nhỏ hơn số ' + bcTenCongDon(thLon) + ' (' + lon + ')');
      else if (x < tong) baoDong(ma, 'Số ' + bcTenCongDon(gocThang) + ' trên bcth (' + x + ') nhỏ hơn tổng các tháng đã báo cáo (' + tong + ')');
    });
  }

  // 2. Báo cáo tháng: số đơn vị gõ + các cột tự tính
  var thang = {}; nhapCT.forEach(function (r) { if (typeof nhap[r[0]] === 'number' && isFinite(nhap[r[0]])) thang[r[0]] = nhap[r[0]]; });
  bcApCongThuc(bieu, thang, 'T');

  // 3. Lũy kế đến tháng này, quý
  var lk = {}, quy = null, thieuQ = [], tay = { C: {}, Q: {} };
  if (m % 3 === 0) { quy = {}; for (j = m - 2; j < m; j++) if (!T(j)) thieuQ.push(j); }
  var t1 = quy ? T(m - 2) : null, t2 = quy ? T(m - 1) : null;
  nhapCT.forEach(function (r) {
    var ma = r[0], l = bcLoaiCua(bieu, r), x = so(thang, ma), a, q;
    if (l.k === 'CONG' || l.k === 'TAY') { a = so(goc, ma) + x; q = so(t1, ma) + so(t2, ma) + x; }
    else if (l.k === 'DAU') { a = (m === 1 || coGi === false) ? x : so(goc, ma); q = t1 ? so(t1, ma) : (t2 ? so(t2, ma) : x); }
    else if (l.k === 'TON') { a = x; q = x; (l.d || []).forEach(function (d) { a += so(goc, d); q += so(t1, d) + so(t2, d); }); }
    else { a = x; q = x; } // DIEM, TYLE
    if (l.k === 'TAY') {
      tay.C[ma] = a; if (quy) tay.Q[ma] = q;
      if (typeof nhap[ma + '@C'] === 'number' && isFinite(nhap[ma + '@C'])) a = nhap[ma + '@C'];
      if (typeof nhap[ma + '@Q'] === 'number' && isFinite(nhap[ma + '@Q'])) q = nhap[ma + '@Q'];
    }
    lk[ma] = a; if (quy) quy[ma] = q;
  });
  bcApCongThuc(bieu, lk, 'C'); if (quy) bcApCongThuc(bieu, quy, 'Q');
  if (thieuQ.length && (m === 3 || coGi !== false)) canhBao.push('Thiếu báo cáo tháng ' + thieuQ.join(', ') + ' trên bcth nên số quý chưa gồm các tháng này.');

  var bo = bcBoBaoCao(ky, bieu.ten).map(function (b) { return { k: b.k, ten: b.ten, mau: b.mau, so: b.k === 'T' ? thang : (b.k === 'Q' ? quy : lk) }; });
  return { goc: goc, gocTen: gocTen, gocThang: gocThang, thang: thang, lk: lk, quy: quy, bo: bo, canhBao: canhBao, dong: dong, tay: tay };
}

// Biểu 01/PCTN (giữ tên hàm cũ)
function bcTinh(chiTieu, lichSu, ky, nhap) { return bcTinhBieu({ ten: '01/PCTN', chiTieu: chiTieu }, lichSu, ky, nhap); }

if (typeof module !== 'undefined') module.exports = { bcKy: bcKy, bcTachKy: bcTachKy, bcKySau: bcKySau, bcLoaiCT: bcLoaiCT, bcLoaiCua: bcLoaiCua, bcBoBaoCao: bcBoBaoCao, bcTenCongDon: bcTenCongDon, bcCongDonCua: bcCongDonCua, bcApCongThuc: bcApCongThuc, bcTinhBieu: bcTinhBieu, bcTinh: bcTinh, BC_THOI_DIEM: BC_THOI_DIEM, BC_TY_LE: BC_TY_LE };
