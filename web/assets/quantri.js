// Trang quản trị: dấu trang đồng bộ, tình trạng số liệu, kỳ nhập
(function () {
  var W = BC_WEB, $ = W.$, esc = W.esc, token = null;

  function ve(d) {
    $('pDN').hidden = true; $('pQT').hidden = false;
    var api = /^https?:/.test(BC_API) ? BC_API : location.origin + BC_API;
    var ma = "javascript:(function(){window.__bcCfg={u:'" + api + "',k:'" + d.khoa + "'};fetch(window.__bcCfg.u+'?js=1&k='+window.__bcCfg.k+'&t='+Date.now()).then(function(r){return r.text()}).then(function(t){var s=document.createElement('script');s.textContent=t;document.body.appendChild(s)}).catch(function(e){alert('Không nạp được công cụ đồng bộ (v2): '+e.message)})})();";
    // Nạp bằng fetch (không kèm cookie) rồi chèn mã: thẻ <script src> tới script.google.com bị lỗi khi Chrome đăng nhập nhiều tài khoản Google (đã gặp 20/11/2026)
    $('dauTrang').setAttribute('href', ma); $('maDT').value = ma;
    $('tomTat').textContent = d.soDonVi + ' đơn vị trong danh mục. ' + (d.dongBoLuc ? 'Đồng bộ gần nhất: ' + d.dongBoLuc + '. ' : 'Chưa đồng bộ lần nào. ') + 'Số đơn vị đã lưu số nhập dở của kỳ ' + d.kyNhap + ': ' + d.dangNhap + '.';
    var ds = d.dsBieu || [{ id: '01PCTN', ten: '01/PCTN' }];
    $('bangKy').innerHTML = '<tr><th>Kỳ</th>' + ds.map(function (b) { return '<th>' + esc(b.ten) + '</th>'; }).join('') + '</tr>'
      + (d.ky.length ? d.ky.map(function (k) {
        return '<tr><td>' + esc(k.ky) + '</td>' + ds.map(function (b) { var o = (k.bieu || {})[b.id]; return '<td>' + (o ? o.T + ' / ' + o.C + ' / ' + o.Q + (o.traLai ? ' <span style="color:#b3261e" title="Số báo cáo đang bị trả lại">(' + o.traLai + ' trả lại)</span>' : '') : '–') + '</td>'; }).join('') + '</tr>';
      }).join('') : '<tr><td colspan="' + (ds.length + 1) + '">Chưa có số liệu</td></tr>');
    $('lkBang').href = d.bang || '#';
    $('kyHT').textContent = W.tenKy(d.kyNhap) + (d.kyNhapDat ? ' (đặt tay)' : ' (tự động)');
    $('oKy').value = d.kyNhapDat || ''; $('ckMo').checked = !!d.moNhap;
  }
  async function dangNhap() {
    $('loi').textContent = ''; $('nutVao').disabled = true;
    try { var d = await W.goi({ action: 'qtDangNhap', mk: $('oMK').value }); token = d.token; try { sessionStorage.setItem('bcttcp_qt', token); } catch (e) { } $('oMK').value = ''; ve(d); }
    catch (e) { $('loi').textContent = e.message; }
    $('nutVao').disabled = false;
  }
  async function tai() { try { ve(await W.goi({ action: 'qtTongQuan', token: token })); } catch (e) { $('tomTat').textContent = e.message; } }
  async function luuCH() {
    $('ttCH').textContent = 'Đang lưu…';
    try { ve(await W.goi({ action: 'qtCauHinh', token: token, kyNhap: $('oKy').value, moNhap: $('ckMo').checked })); $('ttCH').textContent = 'Đã lưu.'; }
    catch (e) { $('ttCH').textContent = e.message; }
  }
  $('nutVao').addEventListener('click', dangNhap);
  $('oMK').addEventListener('keydown', function (e) { if (e.key === 'Enter') dangNhap(); });
  $('nutTai').addEventListener('click', tai);
  $('nutLuuCH').addEventListener('click', luuCH);
  $('dauTrang').addEventListener('click', function (e) { e.preventDefault(); }); // nút chỉ để kéo lên thanh dấu trang
  (async function () {
    try { token = sessionStorage.getItem('bcttcp_qt'); } catch (e) { }
    if (token) { try { ve(await W.goi({ action: 'qtTongQuan', token: token })); } catch (e) { token = null; } }
  })();
})();
