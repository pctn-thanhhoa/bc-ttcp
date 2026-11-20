// Trang của đơn vị: đăng nhập, xem số các tháng đã gửi trên bcth, nhập số tháng này, tự tính lũy kế/quý, xuất tệp import
(function () {
  var W = BC_WEB, $ = W.$, esc = W.esc, fmt = W.fmt;
  var KHOA_PHIEN = 'bcttcp_tk';
  var S = { token: null, hs: null, so: {}, chuaLuu: false, henLuu: null, dangLuu: false, kq: null };
  var NHAP = BC_CHI_TIEU.filter(function (r) { return r[5]; });
  var MA_THEO_SO = {}; NHAP.forEach(function (r) { if (r[1] && !MA_THEO_SO[r[1]]) MA_THEO_SO[r[1]] = r[0]; });

  // ------------------------------------------------------------ đăng nhập
  var DS = [];
  function veDanhSach() {
    var tu = W.khongDau($('oTim').value.trim()), sel = $('oDV'), cu = sel.value, html = '';
    ['Cấp tỉnh', 'Xã, phường'].forEach(function (khoi) {
      var ds = DS.filter(function (d) { return d.khoi === khoi && (!tu || W.khongDau(d.ten).indexOf(tu) >= 0); });
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

  // ------------------------------------------------------------ dựng trang nhập
  function vao(hs) {
    S.hs = hs; S.so = {}; S.chuaLuu = false;
    var ky = hs.kyNhap, k = bcTachKy(ky), m = k.thang, nam = k.nam;
    $('pDangNhap').hidden = true; $('pNhap').hidden = false; $('nutThoat').hidden = false; $('lkQT').hidden = true;
    $('tenDV').textContent = hs.donVi.ten;

    var may = docMay(), tuMay = false;
    if (may && !may.daLuu && may.so && Object.keys(may.so).length) { S.so = may.so; S.chuaLuu = true; tuMay = true; }
    else if (hs.nhap) S.so = hs.nhap.so || {};
    Object.keys(S.so).forEach(function (ma) { if (typeof S.so[ma] !== 'number' || !isFinite(S.so[ma])) delete S.so[ma]; });

    var tr = m === 1 ? { t: 12, n: nam - 1 } : { t: m - 1, n: nam };
    $('tdKy').textContent = 'Kỳ đang nhập: ' + W.tenKy(ky);
    var bo = bcBoBaoCao(ky);
    $('moTaKy').innerHTML = 'Số liệu tính từ ngày 15/' + tr.t + '/' + tr.n + ' đến ngày 14/' + m + '/' + nam + '. '
      + 'Trên bcth, kỳ này đơn vị lập <b>' + bo.length + ' báo cáo biểu 01/PCTN</b>: ' + bo.map(function (b) { return esc(b.mau) + ' (' + esc(b.ten.charAt(0).toLowerCase() + b.ten.slice(1)) + ')'; }).join('; ') + '.'
      + (hs.dongBo ? ' <span class="mo">Số các tháng trước đồng bộ từ bcth lúc ' + esc(hs.dongBo) + '.</span>' : '')
      + (hs.moNhap ? '' : ' <b style="color:#b3261e">Hệ thống đang tạm khóa nhập liệu – chỉ xem.</b>');

    // Các tháng trước (cùng năm) đã có báo cáo tháng trên bcth
    S.thangLS = []; for (var j = 1; j < m; j++) { var d = hs.lichSu[bcKy(nam, j)]; if (d && d.T) S.thangLS.push(j); }
    var kq0 = bcTinh(BC_CHI_TIEU, hs.lichSu, ky, {});
    var coGoc = m > 1, boKhac = bo.filter(function (b) { return b.k !== 'T'; });
    S.boKhac = boKhac;
    var soCot = 3 + S.thangLS.length + (coGoc ? 1 : 0) + 1 + boKhac.length;

    var h = '<thead><tr><th>Số chỉ số</th><th>Tên chỉ số</th><th>Đơn vị tính</th>'
      + S.thangLS.map(function (j) { return '<th class="ls">Tháng ' + j + '<small>đã gửi</small></th>'; }).join('')
      + (coGoc ? '<th>Số gốc đến hết tháng ' + (m - 1) + '<small>' + esc(kq0.gocTen) + '</small></th>' : '')
      + '<th>Tháng ' + m + ' – NHẬP<small>01/PCTN - THÁNG</small></th>'
      + boKhac.map(function (b) { return '<th>' + esc(b.ten) + '<small>' + esc(b.mau) + ' (tự tính)</small></th>'; }).join('')
      + '</tr></thead><tbody>';
    BC_CHI_TIEU.forEach(function (r) {
      var ma = r[0], thut = 'padding-left:' + (7 + r[4] * 14) + 'px';
      if (!r[5]) { h += '<tr class="nhom"><td class="stt">' + esc(r[1]) + '</td><td colspan="' + (soCot - 1) + '" style="' + thut + '">' + esc(r[2]) + '</td></tr>'; return; }
      var loai = bcLoaiCT(r);
      h += '<tr id="d_' + ma + '"><td class="stt">' + esc(r[1]) + '</td><td class="ten" style="' + thut + '">' + esc(r[2])
        + (loai === 'DIEM' ? ' <span class="mo">(số tại thời điểm báo cáo – không cộng dồn)</span>' : loai === 'TYLE' ? ' <span class="mo">(tỷ lệ – không cộng dồn)</span>' : '')
        + '<span id="g_' + ma + '"></span></td><td class="dvt">' + esc(r[3]) + '</td>'
        + S.thangLS.map(function (j) { var d = hs.lichSu[bcKy(nam, j)].T; return '<td class="so ls">' + fmt(d[ma]) + '</td>'; }).join('')
        + (coGoc ? '<td class="so goc">' + (loai === 'CONG' ? fmt(kq0.goc[ma]) : '<span class="mo">' + fmt(kq0.goc[ma]) + '</span>') + '</td>' : '')
        + '<td class="nhap"><input type="text" inputmode="decimal" autocomplete="off" data-ma="' + ma + '" aria-label="Chỉ tiêu ' + esc(r[1] || r[2]) + ' tháng ' + m + '" value="' + (S.so[ma] === undefined ? '' : esc(fmt(S.so[ma]))) + '"' + (hs.moNhap ? '' : ' disabled') + '></td>'
        + boKhac.map(function (b) { return '<td class="so tinh" id="c_' + b.k + '_' + ma + '"></td>'; }).join('')
        + '</tr>';
    });
    $('bang').innerHTML = h + '</tbody>';

    // Cảnh báo chung về số gốc và tình trạng báo cáo kỳ trước
    var cb = kq0.canhBao.slice();
    Object.keys(hs.tt || {}).forEach(function (kk) { Object.keys(hs.tt[kk]).forEach(function (l) { if (hs.tt[kk][l][1] === 'Rejected' && kk.slice(0, 4) === String(nam)) cb.push('Báo cáo ' + (l === 'T' ? 'tháng' : l === 'Q' ? 'quý' : 'cộng dồn') + ' kỳ ' + W.tenKy(kk) + ' đang bị trả lại trên bcth nên chưa được dùng để tính.'); }); });
    var soDongGoc = Object.keys(kq0.dong).length;
    if (soDongGoc) cb.push('Có ' + soDongGoc + ' chỉ tiêu mà số cộng dồn đã gửi trên bcth có dấu hiệu chưa đúng (ghi ở từng dòng). Trang vẫn dùng số trên bcth làm số gốc; đề nghị đơn vị đối chiếu và điều chỉnh trên bcth nếu cần.');
    if (tuMay) cb.push('Đã khôi phục số liệu chưa lưu trên máy này – bấm "Lưu" để ghi lên máy chủ.');
    $('hopCanhBao').innerHTML = cb.length ? '<div class="canh-bao"><b>Lưu ý</b><ul>' + cb.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></div>' : '';

    $('nutXuat').innerHTML = bo.map(function (b, i) { return '<button class="nut phu" data-xuat="' + i + '" title="Tệp Excel theo mẫu Import số liệu của bcth">Tải tệp: ' + esc(b.ten) + '</button>'; }).join(' ');
    $('nutLuu').disabled = !hs.moNhap;
    capNhat(); veTrangThai(hs.nhap && !tuMay ? 'Đã lưu lúc ' + hs.nhap.luc : '');
  }

  // ------------------------------------------------------------ tính lại sau mỗi lần gõ
  function capNhat() {
    var hs = S.hs, kq = S.kq = bcTinh(BC_CHI_TIEU, hs.lichSu, hs.kyNhap, S.so);
    var laXa = hs.donVi.khoi === 'Xã, phường', coSo = Object.keys(S.so).length > 0;
    var ghi = {}, them = function (ma, loai, s) { if (ma) (ghi[ma] = ghi[ma] || []).push([loai, s]); };
    Object.keys(kq.dong).forEach(function (ma) { kq.dong[ma].forEach(function (s) { them(ma, 'GOC', s); }); });
    var ds = [];
    if (coSo) kq.bo.forEach(function (b) {
      bcKiemTra(BC_CHI_TIEU, b.so, laXa).forEach(function (x) {
        ds.push({ muc: x.muc, bc: b.ten, nd: x.nd });
        them(MA_THEO_SO[x.so[0]], x.muc, b.ten + ': ' + x.nd);
      });
    });
    NHAP.forEach(function (r) {
      var ma = r[0];
      S.boKhac.forEach(function (b) { var o = b.k === 'Q' ? kq.quy : kq.lk; $('c_' + b.k + '_' + ma).textContent = fmt(o[ma]); });
      var g = ghi[ma] || [], tr = $('d_' + ma);
      $('g_' + ma).innerHTML = g.map(function (x) { return '<span class="ghi ' + x[0] + '">' + (x[0] === 'GOC' ? '⚠ ' : x[0] === 'SAI' ? '✘ ' : '• ') + esc(x[1]) + '</span>'; }).join('');
      tr.className = g.some(function (x) { return x[0] === 'SAI'; }) ? 'co-loi' : (g.length ? 'co-xem' : '');
    });
    var sai = ds.filter(function (x) { return x.muc === 'SAI'; }).length;
    $('ketQuaKT').className = '';
    $('ketQuaKT').innerHTML = !coSo ? '<span class="mo">Chưa nhập số liệu tháng này.</span>'
      : !ds.length ? 'Không phát hiện điểm bất hợp lý trong các báo cáo của kỳ.'
        : '<div>' + sai + ' điểm cần điều chỉnh, ' + (ds.length - sai) + ' điểm cần xem lại (có thể đúng):</div><ul class="kt">' + ds.map(function (x) { return '<li><span class="nhan ' + x.muc + '">' + (x.muc === 'SAI' ? 'Điều chỉnh' : 'Xem lại') + '</span><b>' + esc(x.bc) + '</b> – ' + esc(x.nd) + '</li>'; }).join('') + '</ul>'
        + '<div class="mo">Điểm bất hợp lý ở báo cáo lũy kế có thể do số đã gửi các kỳ trước; khi đó cần điều chỉnh trên bcth.</div>';
  }
  function veTrangThai(s) {
    var e = $('trangThai');
    if (S.dangLuu) { e.className = 'trang-thai'; e.textContent = 'Đang lưu…'; }
    else if (S.chuaLuu) { e.className = 'trang-thai chua'; e.textContent = 'Có thay đổi chưa lưu'; }
    else { e.className = 'trang-thai'; e.textContent = s || e.textContent; }
  }
  function khiGo(ev) {
    var o = ev.target, ma = o.getAttribute('data-ma'); if (!ma) return;
    var x = W.docSo(o.value);
    if (x === null) { delete S.so[ma]; o.classList.remove('sai'); }
    else if (isNaN(x)) { delete S.so[ma]; o.classList.add('sai'); }
    else { S.so[ma] = x; o.classList.remove('sai'); }
    S.chuaLuu = true; luuMay(false); capNhat(); veTrangThai();
    clearTimeout(S.henLuu); S.henLuu = setTimeout(function () { luu(true); }, 5000);
  }
  function khiRoi(ev) { var o = ev.target, ma = o.getAttribute && o.getAttribute('data-ma'); if (ma && S.so[ma] !== undefined) o.value = fmt(S.so[ma]); }
  function phimEnter(ev) { // Enter / mũi tên lên xuống: chuyển ô
    if (!ev.target.getAttribute('data-ma') || ['Enter', 'ArrowDown', 'ArrowUp'].indexOf(ev.key) < 0) return;
    var ds = Array.prototype.slice.call(document.querySelectorAll('#bang input[data-ma]')), i = ds.indexOf(ev.target) + (ev.key === 'ArrowUp' ? -1 : 1);
    if (ds[i]) { ev.preventDefault(); ds[i].focus(); ds[i].select(); }
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
      if (/hết hạn/.test(e.message)) { alert(e.message + ' Số liệu vừa gõ vẫn được giữ trên máy này.'); try { sessionStorage.removeItem(KHOA_PHIEN); } catch (x) { } location.reload(); }
      else if (!tuDong) alert('Chưa lưu được: ' + e.message);
    }
  }

  // ------------------------------------------------------------ xuất tệp theo mẫu "Import số liệu" của bcth
  // Mẫu của bcth: 3 dòng đầu (đơn vị, tên báo cáo, kỳ), dòng tiêu đề STT | Mã chỉ tiêu | Tên chỉ tiêu | Đơn vị | Giá trị, mỗi chỉ tiêu một dòng
  function xuat(i) {
    var b = S.kq.bo[i], hs = S.hs, dem = [], rows = [[hs.donVi.ten, '', '', '', ''], [b.mau, '', '', '', ''], [b.ten + ' – kỳ nhập ' + W.tenKy(hs.kyNhap), '', '', '', ''], ['STT', 'Mã chỉ tiêu', 'Tên chỉ tiêu', 'Đơn vị', 'Giá trị']];
    BC_CHI_TIEU.forEach(function (r) {
      var lv = r[4]; dem.length = lv + 1; dem[lv] = (dem[lv] || 0) + 1;
      var v = b.so ? b.so[r[0]] : undefined;
      rows.push([dem.join('.'), r[0], new Array(lv * 4 + 1).join(' ') + r[2], r[3], r[5] ? (typeof v === 'number' && isFinite(v) ? v : 0) : '']);
    });
    var blob = bcXlsx(rows, ['A1:E1', 'A2:E2', 'A3:E3'], [8, 14, 90, 14, 16]);
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = hs.donVi.ma + '_01PCTN_' + W.khongDau(b.ten).replace(/[^a-z0-9]+/g, '_') + '_' + hs.kyNhap + '.xlsx';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
  }

  // ------------------------------------------------------------ khởi động
  $('oTim').addEventListener('input', veDanhSach);
  $('nutVao').addEventListener('click', dangNhap);
  $('oMa').addEventListener('keydown', function (e) { if (e.key === 'Enter') dangNhap(); });
  $('nutThoat').addEventListener('click', thoat);
  $('nutLuu').addEventListener('click', function () { luu(false); });
  $('bang').addEventListener('input', khiGo);
  $('bang').addEventListener('focusout', khiRoi);
  $('bang').addEventListener('keydown', phimEnter);
  $('ckLS').addEventListener('change', function () { $('khungBang').classList.toggle('an-ls', !this.checked); });
  $('nutXuat').addEventListener('click', function (e) { var i = e.target.getAttribute('data-xuat'); if (i !== null) xuat(+i); });
  window.addEventListener('beforeunload', function (e) { if (S.chuaLuu) { e.preventDefault(); e.returnValue = ''; } });

  (async function () {
    var tk = null; try { tk = sessionStorage.getItem(KHOA_PHIEN); } catch (e) { }
    if (tk) { try { S.token = tk; vao(await W.goi({ action: 'hoSo', token: tk })); return; } catch (e) { try { sessionStorage.removeItem(KHOA_PHIEN); } catch (x) { } } }
    try { DS = (await W.lay('action=danhMuc')).donVi; veDanhSach(); if (!DS.length) $('loiDN').textContent = 'Chưa có danh mục đơn vị (chưa đồng bộ dữ liệu lần đầu).'; }
    catch (e) { $('loiDN').textContent = e.message; }
  })();
})();
