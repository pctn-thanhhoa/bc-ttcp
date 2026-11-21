// Trang của đơn vị: đăng nhập, xem số các tháng đã gửi trên bcth, nhập số tháng này cho từng biểu,
// tự tính cột tổng / lũy kế / quý, kiểm tra logic, xuất tệp theo mẫu "Import số liệu" của bcth.
// Biểu 01/PCTN trình bày dọc (chỉ tiêu theo dòng); 6 biểu TCD-KNTC trình bày ngang như mẫu biểu giấy.
(function () {
  var W = BC_WEB, $ = W.$, esc = W.esc, fmt = W.fmt;
  var KHOA_PHIEN = 'bcttcp_tk';
  var DS = bcDsBieu();
  var S = { token: null, hs: null, so: {}, chuaLuu: false, henLuu: null, dangLuu: false, kq: {}, tab: '01PCTN' };

  // ------------------------------------------------------------ đăng nhập
  var DV = [];
  function veDanhSach() {
    var tu = W.khongDau($('oTim').value.trim()), sel = $('oDV'), cu = sel.value, html = '';
    ['Cấp tỉnh', 'Xã, phường'].forEach(function (khoi) {
      var ds = DV.filter(function (d) { return d.khoi === khoi && (!tu || W.khongDau(d.ten).indexOf(tu) >= 0); });
      if (ds.length) html += '<optgroup label="' + (khoi === 'Cấp tỉnh' ? 'Sở, ban, ngành, đơn vị cấp tỉnh' : 'Xã, phường') + ' (' + ds.length + ')">' + ds.map(function (d) { return '<option value="' + esc(d.ma) + '">' + esc(d.ten) + '</option>'; }).join('') + '</optgroup>';
    });
    sel.innerHTML = html || '<option disabled>Không tìm thấy đơn vị</option>';
    if (cu) sel.value = cu;
    if (!sel.value && sel.options.length === 1 && !sel.options[0].disabled) sel.selectedIndex = 0;
  }
  async function dangNhap() {
    var ma = $('oDV').value, mk = $('oMa').value.trim();
    $('loiDN').textContent = '';
    if (!ma) { $('loiDN').textContent = 'Đề nghị chọn đơn vị.'; return; }
    if (!mk) { $('loiDN').textContent = 'Đề nghị nhập mã truy cập.'; return; }
    $('nutVao').disabled = true;
    try {
      var hs = await W.goi({ action: 'dangNhap', ma: ma, mk: mk });
      S.token = hs.token; try { sessionStorage.setItem(KHOA_PHIEN, hs.token); } catch (e) { }
      $('oMa').value = ''; vao(hs);
    } catch (e) { $('loiDN').textContent = e.message; }
    $('nutVao').disabled = false;
  }
  function thoat() {
    if (S.chuaLuu && !confirm('Còn số liệu chưa lưu lên máy chủ. Vẫn thoát?')) return;
    try { sessionStorage.removeItem(KHOA_PHIEN); } catch (e) { }
    S.chuaLuu = false; location.reload();
  }

  // ------------------------------------------------------------ bản nháp trên máy
  var khoaNhap = function () { return 'bcttcp_nhap_' + S.hs.donVi.ma + '_' + S.hs.kyNhap; };
  function luuMay(daLuu) { try { localStorage.setItem(khoaNhap(), JSON.stringify({ so: S.so, daLuu: !!daLuu })); } catch (e) { } }
  function docMay() { try { return JSON.parse(localStorage.getItem(khoaNhap()) || 'null'); } catch (e) { return null; } }

  // ------------------------------------------------------------ tiện ích theo biểu
  var bieuHT = function () { return bcBieu(S.tab); };
  var lichSu = function (id) { var b = S.hs.bieu && S.hs.bieu[id]; return b ? b.lichSu : (id === '01PCTN' && S.hs.lichSu) || {}; };
  var tinhTrang = function (id) { var b = S.hs.bieu && S.hs.bieu[id]; return b ? b.tt : (id === '01PCTN' && S.hs.tt) || {}; };
  var nhapCua = function (bieu) { return bieu.chiTieu.filter(function (r) { return r[5]; }); };
  var tuTinhT = function (bieu) { var o = {}; (bieu.congThuc || []).forEach(function (f) { if (f.ap === '*' || f.ap === 'T') o[f.ma] = 1; }); return o; };
  var tuTinhCQ = function (bieu) { var o = {}; (bieu.congThuc || []).forEach(function (f) { if (f.ap === '*' || f.ap === 'CQ') o[f.ma] = 1; }); return o; };
  var coSo = function (bieu) { return nhapCua(bieu).some(function (r) { return S.so[r[0]] !== undefined; }); };
  function thangLS(id) { var k = bcTachKy(S.hs.kyNhap), o = [], j; for (j = 1; j < k.thang; j++) { var d = lichSu(id)[bcKy(k.nam, j)]; if (d && d.T) o.push(j); } return o; }
  function oNhap(key, nhan, tay, goiY) {
    var v = S.so[key];
    return '<input type="text" inputmode="decimal" autocomplete="off" data-ma="' + key + '" aria-label="' + esc(nhan) + '"' + (tay ? ' class="tay" placeholder="' + esc(fmt(goiY)) + '" title="Trang gợi ý ' + esc(fmt(goiY)) + ' (cộng thẳng) – sửa nếu số thực tế khác"' : '') + ' value="' + (v === undefined ? '' : esc(fmt(v))) + '"' + (S.hs.moNhap ? '' : ' disabled') + '>';
  }

  // ------------------------------------------------------------ vào trang nhập
  function vao(hs) {
    S.hs = hs; S.so = {}; S.chuaLuu = false;
    var ky = hs.kyNhap, k = bcTachKy(ky), m = k.thang, nam = k.nam;
    $('pDangNhap').hidden = true; $('pNhap').hidden = false; $('nutThoat').hidden = false; $('lkQT').hidden = true;
    $('tenDV').textContent = hs.donVi.ten;

    var may = docMay(); S.tuMay = false;
    if (may && !may.daLuu && may.so && Object.keys(may.so).length) { S.so = may.so; S.chuaLuu = true; S.tuMay = true; }
    else if (hs.nhap) S.so = hs.nhap.so || {};
    Object.keys(S.so).forEach(function (ma) { if (typeof S.so[ma] !== 'number' || !isFinite(S.so[ma])) delete S.so[ma]; });

    var tr = m === 1 ? { t: 12, n: nam - 1 } : { t: m - 1, n: nam }, bo = bcBoBaoCao(ky, '…');
    $('tdKy').textContent = 'Kỳ báo cáo đang lập: ' + W.tenKy(ky);
    $('moTaKy').innerHTML = 'Số liệu tính từ ngày 15/' + tr.t + '/' + tr.n + ' đến ngày 14/' + m + '/' + nam + '. '
      + 'Trên bcth, kỳ này mỗi biểu lập <b>' + bo.length + ' báo cáo</b>: ' + bo.map(function (b) { return esc(b.ten.charAt(0).toLowerCase() + b.ten.slice(1)); }).join(', ') + '.'
      + (hs.dongBo ? ' <span class="mo">Số các tháng trước đồng bộ từ bcth lúc ' + esc(hs.dongBo) + '.</span>' : '')
      + (hs.moNhap ? '' : ' <b style="color:#b3261e">Hệ thống đang tạm khóa nhập liệu – chỉ xem.</b>');
    $('hopCanhBao').innerHTML = S.tuMay ? '<div class="canh-bao">Đã khôi phục số liệu chưa lưu trên máy này – bấm "Lưu" để ghi lên máy chủ.</div>' : '';
    $('nutLuu').disabled = !hs.moNhap; $('nutDien0').disabled = !hs.moNhap; $('nutXoaBieu').disabled = !hs.moNhap;
    try { var t = sessionStorage.getItem('bcttcp_tab'); if (t && bcBieu(t)) S.tab = t; } catch (e) { }
    veBieu(); veTrangThai(hs.nhap && !S.tuMay ? 'Đã lưu lúc ' + hs.nhap.luc : '');
  }

  function veThe() {
    $('tabBieu').innerHTML = DS.map(function (b) {
      var loi = (S.loiTheoBieu || {})[b.id] || 0;
      return '<button role="tab" data-tab="' + b.id + '" class="' + (b.id === S.tab ? 'chon' : '') + '" title="' + esc(b.tieuDe) + '">' + esc(b.ten)
        + (loi ? '<span class="dem" title="Số điểm chưa hợp lý ở số kỳ đang lập">' + loi + '</span>' : (coSo(b) ? '<span class="co" title="Đã có số tháng này"></span>' : '')) + '</button>';
    }).join('');
  }

  // ------------------------------------------------------------ rà soát số liệu ĐÃ GỬI trên bcth của một biểu (các kỳ trong năm đã đồng bộ)
  // Trả về [{ ky: số tháng, bc: tên báo cáo, muc, nd }]
  function raSoatDaGui(bieu) {
    var k = bcTachKy(S.hs.kyNhap), nam = k.nam, L = lichSu(bieu.id), laXa = S.hs.donVi.khoi === 'Xã, phường', kq = [], j;
    var tuTinh = {}; (bieu.congThuc || []).forEach(function (f) { tuTinh[f.ma] = 1; });
    var nhan = function (r) { return bieu.kieu === 'DOC' ? (r[1] ? 'CT ' + r[1] : r[2]) : 'Cột (' + bieu.ms[r[0]] + ')'; };
    var so = function (o, ma) { var v = o ? o[ma] : 0; return typeof v === 'number' && isFinite(v) ? v : 0; };
    for (j = 1; j < k.thang; j++) {
      var d = L[bcKy(nam, j)]; if (!d) continue;
      var cd = bcCongDonCua(L, nam, j), cdTruoc = j > 1 ? bcCongDonCua(L, nam, j - 1) : null;
      [['T', 'tháng ' + j], ['C', bcTenCongDon(j)], ['Q', 'quý']].forEach(function (x) {
        if (!d[x[0]] || (x[0] === 'Q' && j === 3 && !d.C)) return; // quý I đã xét ở dòng cộng dồn
        bcKiemTraBieu(bieu, d[x[0]], laXa).forEach(function (e) { kq.push({ ky: j, bc: x[1], muc: e.muc, nd: e.nd }); });
      });
      if (cd) nhapCua(bieu).forEach(function (r) {
        if (bcLoaiCua(bieu, r).k !== 'CONG' || tuTinh[r[0]]) return;
        var a = so(cd, r[0]), t = so(d.T, r[0]);
        if (d.T && t > a) kq.push({ ky: j, bc: bcTenCongDon(j), muc: 'SAI', nd: nhan(r) + ': số tháng ' + j + ' (' + fmt(t) + ') lớn hơn số ' + bcTenCongDon(j) + ' (' + fmt(a) + ')' });
        if (cdTruoc) {
          var p = so(cdTruoc, r[0]);
          if (a < p) kq.push({ ky: j, bc: bcTenCongDon(j), muc: 'SAI', nd: nhan(r) + ': số ' + bcTenCongDon(j) + ' (' + fmt(a) + ') nhỏ hơn số ' + bcTenCongDon(j - 1) + ' (' + fmt(p) + ')' });
          else if (d.T && Math.abs(a - p - t) > 1e-6) kq.push({ ky: j, bc: bcTenCongDon(j), muc: 'XEM', nd: nhan(r) + ': số ' + bcTenCongDon(j) + ' tăng ' + fmt(a - p) + ' so với ' + bcTenCongDon(j - 1) + ' nhưng số tháng ' + j + ' là ' + fmt(t) });
        }
      });
    }
    return kq;
  }
  function veRaSoat(bieu) {
    var k = bcTachKy(S.hs.kyNhap), L = lichSu(bieu.id), cac = [], j;
    for (j = 1; j < k.thang; j++) { var d = L[bcKy(k.nam, j)]; if (d) cac.push(j + (d.T ? '' : ' (thiếu báo cáo tháng)') + (bcCongDonCua(L, k.nam, j) ? '' : ' (thiếu báo cáo cộng dồn)')); }
    if (!cac.length) { $('raSoatDaGui').innerHTML = 'Chưa có số liệu năm ' + k.nam + ' của biểu này (đơn vị chưa gửi trên bcth hoặc Thanh tra tỉnh chưa cập nhật vào trang).'; return; }
    var ds = raSoatDaGui(bieu), sai = ds.filter(function (x) { return x.muc === 'SAI'; }).length, theoKy = {};
    ds.forEach(function (x) { (theoKy[x.ky] = theoKy[x.ky] || []).push(x); });
    var h = '<div>Đã có số liệu các tháng: ' + esc(cac.join(', ')) + '.</div>';
    if (!ds.length) h += '<div style="color:#0b6b4f;margin-top:4px">Không phát hiện điểm chưa thống nhất trong số liệu đã gửi của biểu này.</div>';
    else h += '<div style="margin-top:4px;color:#1c2733">Phát hiện <b>' + sai + '</b> điểm chưa hợp lý và <b>' + (ds.length - sai) + '</b> điểm cần xem lại (có thể đúng) trong số liệu đã gửi:</div>'
      + Object.keys(theoKy).sort(function (x, y) { return y - x; }).map(function (ky, i) {
        var l = theoKy[ky], s = l.filter(function (x) { return x.muc === 'SAI'; }).length;
        return '<details' + (i === 0 ? ' open' : '') + '><summary>Kỳ tháng ' + ky + ': ' + s + ' điểm chưa hợp lý, ' + (l.length - s) + ' điểm cần xem lại</summary><ul class="kt">'
          + l.map(function (x) { return '<li><span class="nhan ' + x.muc + '">' + (x.muc === 'SAI' ? 'Chưa hợp lý' : 'Xem lại') + '</span><b>' + esc('Báo cáo ' + x.bc) + '</b>: ' + esc(x.nd) + '</li>'; }).join('') + '</ul></details>';
      }).join('')
      + '<div style="margin-top:4px">Số đã gửi trên bcth được giữ nguyên; kết quả rà soát để đơn vị đối chiếu với sổ sách và lưu ý khi lập báo cáo các kỳ sau.</div>';
    $('raSoatDaGui').innerHTML = h;
  }

  // ------------------------------------------------------------ dựng bảng của biểu đang chọn
  function veBieu() {
    var bieu = bieuHT(), hs = S.hs, ky = hs.kyNhap, m = bcTachKy(ky).thang;
    var kq0 = bcTinhBieu(bieu, lichSu(bieu.id), ky, {}), bo = bcBoBaoCao(ky, bieu.ten);
    S.boKhac = bo.filter(function (b) { return b.k !== 'T'; });
    $('tenBieu').textContent = 'Biểu ' + bieu.ten + ' – ' + bieu.tieuDe + '.';
    $('moTaBieu').textContent = 'Báo cáo phải lập trên bcth: ' + bo.map(function (b) { return b.mau; }).join('; ') + '.';

    var cb = kq0.canhBao.slice(), tt = tinhTrang(bieu.id);
    Object.keys(tt).forEach(function (kk) { Object.keys(tt[kk]).forEach(function (l) { if (tt[kk][l][1] === 'Rejected') cb.push('Báo cáo ' + (l === 'T' ? 'tháng' : l === 'Q' ? 'quý' : 'cộng dồn') + ' kỳ ' + W.tenKy(kk) + ' đang bị trả lại trên bcth nên chưa được dùng để tính.'); }); });
    var soDongGoc = Object.keys(kq0.dong).length;
    if (soDongGoc) cb.push('Có ' + soDongGoc + ' chỉ tiêu mà số cộng dồn đã gửi trên bcth chưa thống nhất với số các tháng (đánh dấu ⚠). Trang vẫn lấy số đã gửi làm số gốc để tính kỳ này; đơn vị lưu ý đối chiếu với sổ sách khi lập báo cáo.');
    $('canhBaoBieu').innerHTML = cb.length ? '<div class="canh-bao"><b>Lưu ý</b><ul>' + cb.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></div>' : '';

    veRaSoat(bieu);
    $('bang').className = 'bieu' + (bieu.kieu === 'NGANG' ? ' ngang' : '');
    $('bang').innerHTML = bieu.kieu === 'NGANG' ? htmlNgang(bieu, kq0, m) : htmlDoc(bieu, kq0, m);
    $('hopGhiChu').hidden = !(bieu.ghiChu && bieu.ghiChu.length);
    $('ghiChuBieu').innerHTML = (bieu.ghiChu || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');
    $('nutXuat').innerHTML = bo.map(function (b, i) { return '<button class="nut phu" data-xuat="' + i + '" title="Tệp Excel theo mẫu Import số liệu của bcth">Tải tệp: ' + esc(b.ten) + '</button>'; }).join(' ')
      + ' <button class="nut phu" data-xuat="tat" title="Tải tệp của mọi biểu đã nhập số tháng này">Tải tất cả tệp của kỳ</button>';
    capNhat();
  }

  // Biểu dọc (01/PCTN): mỗi chỉ tiêu một dòng
  function htmlDoc(bieu, kq0, m) {
    var nam = bcTachKy(S.hs.kyNhap).nam, ls = thangLS(bieu.id), coGoc = m > 1, L = lichSu(bieu.id);
    var soCot = 3 + ls.length + (coGoc ? 1 : 0) + 1 + S.boKhac.length;
    var h = '<thead><tr><th>Số chỉ số</th><th>Tên chỉ số</th><th>Đơn vị tính</th>'
      + ls.map(function (j) { return '<th class="ls">Tháng ' + j + '<small>đã gửi</small></th>'; }).join('')
      + (coGoc ? '<th>Số gốc đến hết tháng ' + (m - 1) + '<small>' + esc(kq0.gocTen) + '</small></th>' : '')
      + '<th>Tháng ' + m + ' – NHẬP<small>' + esc(bieu.ten) + ' - THÁNG</small></th>'
      + S.boKhac.map(function (b) { return '<th>' + esc(b.ten) + '<small>' + esc(b.mau) + ' (tự tính)</small></th>'; }).join('')
      + '</tr></thead><tbody>';
    bieu.chiTieu.forEach(function (r) {
      var ma = r[0], thut = 'padding-left:' + (7 + r[4] * 14) + 'px';
      if (!r[5]) { h += '<tr class="nhom"><td class="stt">' + esc(r[1]) + '</td><td colspan="' + (soCot - 1) + '" style="' + thut + '">' + esc(r[2]) + '</td></tr>'; return; }
      var loai = bcLoaiCua(bieu, r).k;
      h += '<tr id="d_' + ma + '"><td class="stt">' + esc(r[1]) + '</td><td class="ten" style="' + thut + '">' + esc(r[2])
        + (loai === 'DIEM' ? ' <span class="mo">(số tại thời điểm báo cáo – không cộng dồn)</span>' : loai === 'TYLE' ? ' <span class="mo">(tỷ lệ – không cộng dồn)</span>' : '')
        + '<span id="g_' + ma + '"></span></td><td class="dvt">' + esc(r[3]) + '</td>'
        + ls.map(function (j) { return '<td class="so ls">' + fmt(L[bcKy(nam, j)].T[ma]) + '</td>'; }).join('')
        + (coGoc ? '<td class="so goc">' + (loai === 'CONG' ? fmt(kq0.goc[ma]) : '<span class="mo">' + fmt(kq0.goc[ma]) + '</span>') + '</td>' : '')
        + '<td class="nhap" id="n_' + ma + '">' + oNhap(ma, 'Chỉ tiêu ' + (r[1] || r[2]) + ' tháng ' + m) + '</td>'
        + S.boKhac.map(function (b) { return '<td class="so tinh" id="c_' + b.k + '_' + ma + '"></td>'; }).join('')
        + '</tr>';
    });
    return h + '</tbody>';
  }

  // Biểu ngang (6 biểu TCD-KNTC): mỗi ô nhập một cột như mẫu biểu, mỗi kỳ một dòng
  function htmlNgang(bieu, kq0, m) {
    var nam = bcTachKy(S.hs.kyNhap).nam, ls = thangLS(bieu.id), L = lichSu(bieu.id);
    // cây tiêu đề: bỏ dòng gốc (tên biểu)
    var goc = { con: [] }, chong = [goc];
    bieu.chiTieu.forEach(function (r) { var n = { r: r, con: [] }; chong.length = r[4] + 1; (chong[r[4]] || goc).con.push(n); chong[r[4] + 1] = n; });
    var dinh = goc.con.length === 1 && !goc.con[0].r[5] ? goc.con[0].con : goc.con;
    var cao = function (n) { return n.con.length ? 1 + Math.max.apply(null, n.con.map(cao)) : 1; };
    var la = function (n) { return (n.r[5] && n.con.length ? 1 : 0) + (n.con.length ? n.con.reduce(function (t, c) { return t + la(c); }, 0) : 1); };
    var H = Math.max.apply(null, dinh.map(cao)), hang = []; for (var i = 0; i < H; i++) hang.push('');
    var o = function (n, d) {
      if (!n.con.length) { hang[d] += '<th rowspan="' + (H - d) + '">' + esc(n.r[2]) + (n.r[3] ? '<small>' + esc(n.r[3]) + '</small>' : '') + '</th>'; return; }
      hang[d] += '<th colspan="' + la(n) + '">' + esc(n.r[2]) + '</th>';
      if (n.r[5]) hang[d + 1] += '<th rowspan="' + (H - d - 1) + '">Tổng số' + (n.r[3] ? '<small>' + esc(n.r[3]) + '</small>' : '') + '</th>';
      n.con.forEach(function (c) { o(c, d + 1); });
    };
    dinh.forEach(function (n) { o(n, 0); });
    var cthuc = {}; (bieu.congThuc || []).forEach(function (f) { cthuc[f.ma] = '= ' + f.cong.map(function (x) { return bieu.ms[x]; }).join('+') + f.tru.map(function (x) { return '−' + bieu.ms[x]; }).join('') + (f.ap === 'T' ? ' (tháng)' : f.ap === 'CQ' ? ' (lũy kế)' : ''); });
    var h = '<thead>' + hang.map(function (s, d) { return '<tr>' + (d === 0 ? '<th class="ky" rowspan="' + H + '">Kỳ</th>' : '') + s + '</tr>'; }).join('')
      + '<tr class="ms"><th class="ky">MS</th>' + bieu.cot.map(function (r, i) { return '<th id="ms_' + r[0] + '">' + (i + 1) + (cthuc[r[0]] ? '<small>' + esc(cthuc[r[0]]) + '</small>' : '') + '</th>'; }).join('') + '</tr></thead><tbody>';
    var tT = tuTinhT(bieu), tC = tuTinhCQ(bieu);
    ls.forEach(function (j) { var d = L[bcKy(nam, j)].T; h += '<tr class="ls"><td class="ky">Tháng ' + j + '<small>đã gửi trên bcth</small></td>' + bieu.cot.map(function (r) { return '<td class="so ls">' + fmt(d[r[0]]) + '</td>'; }).join('') + '</tr>'; });
    if (m > 1) h += '<tr><td class="ky">' + (kq0.gocThang ? 'Lũy kế đã gửi đến hết tháng ' + kq0.gocThang : 'Số gốc') + '<small>' + esc(kq0.gocTen) + '</small></td>' + bieu.cot.map(function (r) { return '<td class="so goc" id="go_' + r[0] + '">' + fmt(kq0.goc[r[0]]) + '</td>'; }).join('') + '</tr>';
    h += '<tr class="h-nhap"><td class="ky">Tháng ' + m + ' – NHẬP<small>' + esc(bieu.ten) + ' - THÁNG</small></td>'
      + bieu.cot.map(function (r, i) { return tT[r[0]] ? '<td class="so tinh" id="c_T_' + r[0] + '"></td>' : '<td class="nhap" id="n_' + r[0] + '">' + oNhap(r[0], 'Cột ' + (i + 1) + ' tháng ' + m) + '</td>'; }).join('') + '</tr>';
    S.boKhac.forEach(function (b) {
      var kqTay = b.k === 'Q' ? kq0.tay.Q : kq0.tay.C;
      h += '<tr class="h-tinh"><td class="ky">' + esc(b.ten) + '<small>' + esc(b.mau) + ' (tự tính)</small></td>'
        + bieu.cot.map(function (r, i) {
          var tay = bcLoaiCua(bieu, r).k === 'TAY' && !tC[r[0]];
          return tay ? '<td class="nhap" id="n_' + r[0] + '@' + b.k + '">' + oNhap(r[0] + '@' + b.k, 'Cột ' + (i + 1) + ' ' + b.ten, true, kqTay[r[0]]) + '</td>' : '<td class="so tinh" id="c_' + b.k + '_' + r[0] + '"></td>';
        }).join('') + '</tr>';
    });
    return h + '</tbody>';
  }

  // ------------------------------------------------------------ tính lại sau mỗi lần gõ
  function capNhat() {
    var hs = S.hs, laXa = hs.donVi.khoi === 'Xã, phường', ds = [], thang = {};
    S.loiTheoBieu = {};
    DS.forEach(function (b) { S.kq[b.id] = bcTinhBieu(b, lichSu(b.id), hs.kyNhap, S.so); });
    var danh = {}; // mã -> [[loại, nội dung]] của biểu đang xem
    var them = function (ma, loai, s) { if (ma) (danh[ma] = danh[ma] || []).push([loai, s]); };
    DS.forEach(function (b) {
      if (!coSo(b)) return;
      var kq = S.kq[b.id]; thang[b.id] = kq.thang;
      kq.bo.forEach(function (bc) {
        bcKiemTraBieu(b, bc.so, laXa).forEach(function (x) {
          ds.push({ muc: x.muc, bieu: b.ten, bc: bc.ten, nd: x.nd });
          if (x.muc === 'SAI') S.loiTheoBieu[b.id] = (S.loiTheoBieu[b.id] || 0) + 1;
          if (b.id === S.tab) them(x.ma[0], x.muc, bc.ten + ': ' + x.nd);
        });
      });
    });
    bcKiemTraCheo(thang).forEach(function (x) { var b = bcBieu(x.bieu); ds.push({ muc: 'XEM', bieu: b.ten, bc: 'Tháng', nd: x.nd }); if (x.bieu === S.tab) them(x.ma[0], 'XEM', x.nd); });

    var bieu = bieuHT(), kq = S.kq[bieu.id];
    Object.keys(kq.dong).forEach(function (ma) { kq.dong[ma].forEach(function (s) { them(ma, 'GOC', s); }); });
    nhapCua(bieu).forEach(function (r) {
      var ma = r[0], e, g = danh[ma] || [];
      if ((e = $('c_T_' + ma))) e.textContent = fmt(kq.thang[ma]);
      S.boKhac.forEach(function (b) { if ((e = $('c_' + b.k + '_' + ma))) e.textContent = fmt((b.k === 'Q' ? kq.quy : kq.lk)[ma]); });
      S.boKhac.forEach(function (b) { var o = document.querySelector('#bang input[data-ma="' + ma + '@' + b.k + '"]'); if (o) o.placeholder = fmt((b.k === 'Q' ? kq.tay.Q : kq.tay.C)[ma]); }); // ô tự sửa: cập nhật số gợi ý
      var sai = g.some(function (x) { return x[0] === 'SAI'; }), xem = g.some(function (x) { return x[0] === 'XEM'; }), ngo = g.some(function (x) { return x[0] === 'GOC'; });
      var moTa = g.map(function (x) { return (x[0] === 'GOC' ? '⚠ ' : x[0] === 'SAI' ? '✘ ' : '• ') + x[1]; }).join('\n');
      if (bieu.kieu === 'DOC') {
        $('g_' + ma).innerHTML = g.map(function (x) { return '<span class="ghi ' + x[0] + '">' + (x[0] === 'GOC' ? '⚠ ' : x[0] === 'SAI' ? '✘ ' : '• ') + esc(x[1]) + '</span>'; }).join('');
        $('d_' + ma).className = sai ? 'co-loi' : (g.length ? 'co-xem' : '');
      } else {
        var o = $('n_' + ma) || $('c_T_' + ma); if (o) { o.classList.toggle('o-sai', sai); o.classList.toggle('o-xem', !sai && xem); o.title = moTa; }
        if ((e = $('go_' + ma))) { e.classList.toggle('ngo', ngo); if (ngo) { e.title = moTa; if (e.textContent.indexOf('⚠') < 0) e.textContent = '⚠ ' + e.textContent; } }
      }
    });
    var soSai = ds.filter(function (x) { return x.muc === 'SAI'; }).length;
    $('ketQuaKT').className = '';
    $('ketQuaKT').innerHTML = !Object.keys(thang).length ? '<span class="mo">Chưa nhập số liệu tháng này.</span>'
      : !ds.length ? 'Không phát hiện điểm bất hợp lý trong các biểu đã nhập (' + Object.keys(thang).map(function (id) { return bcBieu(id).ten; }).join(', ') + ').'
        : '<div>' + soSai + ' điểm chưa hợp lý, ' + (ds.length - soSai) + ' điểm cần xem lại (có thể đúng):</div><ul class="kt">' + ds.map(function (x) { return '<li><span class="nhan ' + x.muc + '">' + (x.muc === 'SAI' ? 'Chưa hợp lý' : 'Xem lại') + '</span><b>' + esc(x.bieu + ' – ' + x.bc) + '</b>: ' + esc(x.nd) + '</li>'; }).join('') + '</ul>'
        + '<div class="mo">Điểm bất hợp lý ở báo cáo lũy kế, quý có thể bắt nguồn từ số đã gửi các kỳ trước (xem mục 1).</div>';
    veThe();
  }
  function veTrangThai(s) {
    var e = $('trangThai');
    if (S.dangLuu) { e.className = 'trang-thai'; e.textContent = 'Đang lưu…'; }
    else if (S.chuaLuu) { e.className = 'trang-thai chua'; e.textContent = 'Có thay đổi chưa lưu'; }
    else { e.className = 'trang-thai'; e.textContent = s || e.textContent; }
  }
  function daDoi() { S.chuaLuu = true; luuMay(false); capNhat(); veTrangThai(); clearTimeout(S.henLuu); S.henLuu = setTimeout(function () { luu(true); }, 5000); }
  function khiGo(ev) {
    var o = ev.target, ma = o.getAttribute('data-ma'); if (!ma) return;
    var x = W.docSo(o.value);
    if (x === null) { delete S.so[ma]; o.classList.remove('sai'); }
    else if (isNaN(x)) { delete S.so[ma]; o.classList.add('sai'); }
    else { S.so[ma] = x; o.classList.remove('sai'); }
    daDoi();
  }
  function khiRoi(ev) { var o = ev.target, ma = o.getAttribute && o.getAttribute('data-ma'); if (ma && S.so[ma] !== undefined) o.value = fmt(S.so[ma]); }
  function phim(ev) { // Enter, mũi tên: chuyển ô (biểu dọc: lên/xuống; biểu ngang: trái/phải)
    if (!ev.target.getAttribute('data-ma')) return;
    var ngang = bieuHT().kieu === 'NGANG', toi = ngang ? ['Enter', 'ArrowRight'] : ['Enter', 'ArrowDown'], lui = ngang ? ['ArrowLeft'] : ['ArrowUp'];
    var huong = toi.indexOf(ev.key) >= 0 ? 1 : lui.indexOf(ev.key) >= 0 ? -1 : 0; if (!huong) return;
    if (ngang && ev.key !== 'Enter') { var t = ev.target; if (t.selectionStart !== t.selectionEnd || (huong > 0 ? t.selectionStart < t.value.length : t.selectionStart > 0)) return; }
    var ds = Array.prototype.slice.call(document.querySelectorAll('#bang input[data-ma]')), i = ds.indexOf(ev.target) + huong;
    if (ds[i]) { ev.preventDefault(); ds[i].focus(); ds[i].select(); }
  }
  function dien0() { var b = bieuHT(), t = tuTinhT(b); nhapCua(b).forEach(function (r) { if (!t[r[0]] && S.so[r[0]] === undefined) S.so[r[0]] = 0; }); veBieu(); daDoi(); }
  function xoaBieu() {
    var b = bieuHT(); if (!coSo(b) || !confirm('Xóa toàn bộ số tháng này đã nhập của biểu ' + b.ten + '?')) return;
    nhapCua(b).forEach(function (r) { delete S.so[r[0]]; delete S.so[r[0] + '@C']; delete S.so[r[0] + '@Q']; }); veBieu(); daDoi();
  }
  async function luu(tuDong) {
    if (S.dangLuu || !S.hs.moNhap) return;
    clearTimeout(S.henLuu);
    if (document.querySelector('#bang input.sai') && !tuDong) alert('Có ô nhập không phải là số (viền đỏ) – các ô này chưa được lưu.');
    S.dangLuu = true; veTrangThai();
    try {
      var gui = JSON.stringify(S.so);
      var r = await W.goi({ action: 'luu', token: S.token, ky: S.hs.kyNhap, so: S.so });
      S.dangLuu = false;
      if (gui === JSON.stringify(S.so)) { S.chuaLuu = false; luuMay(true); }
      veTrangThai('Đã lưu lúc ' + r.luc);
    } catch (e) {
      S.dangLuu = false; veTrangThai();
      if (/hết hạn/.test(e.message)) { alert(e.message + ' Số liệu vừa gõ vẫn được giữ trên máy này.'); try { sessionStorage.removeItem(KHOA_PHIEN); } catch (x) { } S.chuaLuu = false; location.reload(); }
      else if (!tuDong) alert('Chưa lưu được: ' + e.message);
    }
  }

  // ------------------------------------------------------------ xuất tệp theo mẫu "Import số liệu" của bcth
  // Như tệp "Tải về mẫu import số liệu": 3 dòng đầu (đơn vị, tên báo cáo, kỳ), dòng tiêu đề STT | Mã chỉ tiêu | Tên chỉ tiêu | Đơn vị | Giá trị
  function xuat(bieu, b) {
    var hs = S.hs, dem = [], rows = [[hs.donVi.ten, '', '', '', ''], [b.mau, '', '', '', ''], [b.ten + ' – kỳ nhập ' + W.tenKy(hs.kyNhap), '', '', '', ''], ['STT', 'Mã chỉ tiêu', 'Tên chỉ tiêu', 'Đơn vị', 'Giá trị']];
    bieu.chiTieu.forEach(function (r) {
      var lv = r[4]; dem.length = lv + 1; dem[lv] = (dem[lv] || 0) + 1;
      var v = b.so ? b.so[r[0]] : undefined;
      rows.push([dem.join('.'), r[0], new Array(lv * 4 + 1).join(' ') + r[2], r[3], r[5] ? (typeof v === 'number' && isFinite(v) ? v : 0) : '']);
    });
    var blob = bcXlsx(rows, ['A1:E1', 'A2:E2', 'A3:E3'], [8, 16, 90, 14, 16]);
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = hs.donVi.ma + '_' + bieu.id + '_' + W.khongDau(b.ten).replace(/[^a-z0-9]+/g, '_') + '_' + hs.kyNhap + '.xlsx';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 8000);
  }
  function xuatTatCa() {
    var viec = []; DS.forEach(function (bieu) { if (coSo(bieu)) S.kq[bieu.id].bo.forEach(function (b) { viec.push([bieu, b]); }); });
    if (!viec.length) { alert('Chưa nhập số tháng này cho biểu nào.'); return; }
    viec.forEach(function (v, i) { setTimeout(function () { xuat(v[0], v[1]); }, i * 400); }); // giãn cách để trình duyệt không chặn tải nhiều tệp
  }

  // ------------------------------------------------------------ khởi động
  $('oTim').addEventListener('input', veDanhSach);
  $('nutVao').addEventListener('click', dangNhap);
  $('oMa').addEventListener('keydown', function (e) { if (e.key === 'Enter') dangNhap(); });
  $('nutThoat').addEventListener('click', thoat);
  $('nutLuu').addEventListener('click', function () { luu(false); });
  $('bang').addEventListener('input', khiGo);
  $('bang').addEventListener('focusout', khiRoi);
  $('bang').addEventListener('keydown', phim);
  $('ckLS').addEventListener('change', function () { $('khungBang').classList.toggle('an-ls', !this.checked); });
  $('tabBieu').addEventListener('click', function (e) { var b = e.target.closest('button[data-tab]'); if (!b) return; S.tab = b.getAttribute('data-tab'); try { sessionStorage.setItem('bcttcp_tab', S.tab); } catch (x) { } veBieu(); });
  $('nutXuat').addEventListener('click', function (e) { var i = e.target.getAttribute('data-xuat'); if (i === null) return; if (i === 'tat') xuatTatCa(); else xuat(bieuHT(), S.kq[S.tab].bo[+i]); });
  $('nutDien0').addEventListener('click', dien0);
  $('nutXoaBieu').addEventListener('click', xoaBieu);
  window.addEventListener('beforeunload', function (e) { if (S.chuaLuu) { e.preventDefault(); e.returnValue = ''; } });

  (async function () {
    var tk = null; try { tk = sessionStorage.getItem(KHOA_PHIEN); } catch (e) { }
    if (tk) { try { S.token = tk; vao(await W.goi({ action: 'hoSo', token: tk })); return; } catch (e) { try { sessionStorage.removeItem(KHOA_PHIEN); } catch (x) { } } }
    try { DV = (await W.lay('action=danhMuc')).donVi; veDanhSach(); if (!DV.length) $('loiDN').textContent = 'Chưa có danh mục đơn vị (chưa đồng bộ dữ liệu lần đầu).'; }
    catch (e) { $('loiDN').textContent = e.message; $('oDV').innerHTML = '<option disabled>Chưa tải được danh sách – bấm F5 để thử lại</option>'; }
  })();
})();
